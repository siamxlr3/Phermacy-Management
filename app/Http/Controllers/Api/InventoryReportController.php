<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Medicine;
use App\Models\StockBatch;
use App\Models\PurchaseOrder;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;
use App\Http\Resources\Api\StockBatchResource;

class InventoryReportController extends Controller
{
    /**
     * Generate a comprehensive inventory report with optimized data retrieval.
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'from_date' => 'nullable|date',
            'to_date'   => 'nullable|date|after_or_equal:from_date',
        ]);

        // Default to a wide range if not provided (All time conceptually)
        $fromDate = $request->get('from_date') ?? '2000-01-01'; 
        $toDate = $request->get('to_date') ?? Carbon::now()->addDays(365)->toDateString();
        $cacheKey = "inventory_v2_" . md5($fromDate . $toDate);
        
        $callback = function() use ($fromDate, $toDate) {
            
            // 1. Valuation and Medicine Stats
            $valuationData = $this->getValuationByCategory($fromDate, $toDate);
            
            // 2. Slow Moving Inventory (Optimized via last_sold_at field)
            $slowMoving = Medicine::slowMoving(90)
                ->select(['id', 'medicine_name', 'stock', 'reorder_level', 'last_sold_at'])
                ->orderByDesc('stock')
                ->limit(20)
                ->get()
                ->map(fn($m) => [
                    'id'   => $m->id,
                    'name' => $m->medicine_name,
                    'stock' => $m->stock,
                    'reorder_level' => $m->reorder_level,
                    'last_sold_at' => $m->last_sold_at?->toDateString(),
                ]);

            // 3. Low Stock Items (Consolidated Query)
            $lowStockItems = Medicine::active()
                ->whereColumn('stock', '<=', 'reorder_level')
                ->select(['id', 'medicine_name', 'stock', 'reorder_level'])
                ->orderBy('stock', 'asc')
                ->get();

            return [
                'valuation'    => $valuationData['breakdown'],
                'expiry_risks' => $this->getExpiryRisks($fromDate, $toDate),
                'dues'         => $this->getOutstandingDues($fromDate, $toDate),
                'slow_moving'  => $slowMoving,
                'low_stock'    => $lowStockItems,
                'summaries'    => [
                    'total_stock_value'      => (float) $valuationData['total_value'],
                    'total_pending_payments' => (float) $this->getPendingPaymentsTotal($fromDate, $toDate),
                    'expiry_count'           => (int) $this->getExpiryCount(90, $fromDate, $toDate),
                    'expired_count'          => (int) $this->getExpiredCount($fromDate, $toDate),
                    'low_stock_count'        => (int) $lowStockItems->count(),
                    'total_items'            => (int) $valuationData['total_unique'],
                ],
            ];
        };

        if (Cache::getStore() instanceof \Illuminate\Cache\TaggableStore) {
            $data = Cache::tags(['inventory', 'reports'])->remember($cacheKey, 3600, $callback);
        } else {
            $data = Cache::remember($cacheKey, 3600, $callback);
        }

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * Categorized stock valuation with optimized SQL math.
     */
    private function getValuationByCategory(?string $fromDate = null, ?string $toDate = null): array
    {
        // Use ingested_total_cost_value (Original + Adjustments).
        // This field ignores sales/returns volume as requested, but responds to stock adjustments.
        $query = StockBatch::query()
            ->join('medicines', 'stock_batches.medicine_id', '=', 'medicines.id')
            ->leftJoin('categories', 'medicines.category_id', '=', 'categories.id')
            ->where('stock_batches.qty_tablets', '>', 0); // Include batches that were received

        // Respect the user-selected date range — filter by the batch received date.
        if ($fromDate && $toDate) {
            $query->whereBetween('stock_batches.received_date', [$fromDate, $toDate]);
        }

        $valuation = $query->selectRaw('
                IFNULL(categories.name, "Uncategorized") as category_name,
                SUM(stock_batches.ingested_total_cost_value) as total_value,
                COUNT(DISTINCT medicines.id) as unique_medicines,
                SUM(stock_batches.qty_tablets_remaining) as total_tablets
            ')
            ->groupBy('category_name')
            ->orderByDesc('total_value')
            ->get();

        return [
            'breakdown'    => $valuation->map(fn($v) => [
                'category'  => (string) $v->category_name,
                'value'     => (float) $v->total_value,
                'medicines' => (int) $v->unique_medicines,
                'qty'       => (int) $v->total_tablets
            ]),
            'total_value'  => (float) $valuation->sum('total_value'),
            'total_unique' => (int) $valuation->sum('unique_medicines')
        ];
    }

    /**
     * Focused retrieval of expiring batches. Limit applied for scalability.
     */
    private function getExpiryRisks(?string $fromDate = null, ?string $toDate = null): array
    {
        $expiryLimit = Carbon::parse($toDate)->max(Carbon::today()->addDays(90));

        $query = StockBatch::available();
        if ($fromDate && $toDate) {
            $query->whereBetween('expiry_date', [$fromDate, $toDate]);
        }

        return [
            'critical' => StockBatchResource::collection((clone $query)
                ->where('expiry_date', '<=', Carbon::today()->addDays(30))
                ->with(['medicine:id,medicine_name', 'supplier:id,name'])
                ->orderBy('expiry_date')
                ->limit(50)
                ->get()),
            'warning' => StockBatchResource::collection((clone $query)
                ->where('expiry_date', '<=', $expiryLimit)
                ->with(['medicine:id,medicine_name', 'supplier:id,name'])
                ->orderBy('expiry_date', 'asc')
                ->limit(100)
                ->get()),
        ];
    }

    /**
     * Efficient retrieval of balance dues, fetching only required columns.
     */
    private function getOutstandingDues(?string $fromDate = null, ?string $toDate = null)
    {
        $query = PurchaseOrder::with('supplier:id,name')
            ->select(['id', 'supplier_id', 'total_amount', 'paid_amount', 'order_date'])
            ->where('status', '!=', PurchaseOrder::STATUS_CANCELLED)
            ->where('payment_status', '!=', PurchaseOrder::PAYMENT_STATUS_PAID)
            ->whereRaw('total_amount > paid_amount');

        if ($fromDate && $toDate) {
            $query->whereBetween('order_date', [$fromDate, $toDate]);
        }

        return $query->orderBy('order_date')
            ->get()
            ->map(fn($po) => [
                'id' => $po->id,
                'supplier' => ['name' => $po->supplier?->name],
                'order_date' => $po->order_date?->toDateString(),
                'total_amount' => (float) $po->total_amount,
                'paid_amount' => (float) $po->paid_amount,
                'balance_due' => (float) ($po->total_amount - $po->paid_amount),
            ]);
    }

    private function getPendingPaymentsTotal(?string $fromDate = null, ?string $toDate = null): float
    {
        $query = PurchaseOrder::where('status', '!=', PurchaseOrder::STATUS_CANCELLED)
            ->where('payment_status', '!=', PurchaseOrder::PAYMENT_STATUS_PAID);

        if ($fromDate && $toDate) {
            $query->whereBetween('order_date', [$fromDate, $toDate]);
        }

        return (float) $query->sum(DB::raw('total_amount - paid_amount'));
    }

    private function getExpiryCount(int $days, ?string $fromDate = null, ?string $toDate = null): int
    {
        $query = StockBatch::available();
        
        if ($fromDate && $toDate) {
            $start = Carbon::today()->addDay();
            $rangeStart = Carbon::parse($fromDate);
            $rangeEnd = Carbon::parse($toDate);
            
            // Effect: items expiring in the future part of the selected range
            $effectiveStart = $rangeStart->max($start);
            if ($effectiveStart->gt($rangeEnd)) return 0;

            $query->whereBetween('expiry_date', [$effectiveStart->toDateString(), $rangeEnd->toDateString()]);
        } else {
            $query->expiringSoon($days);
        }

        return (int) $query->count();
    }

    private function getExpiredCount(?string $fromDate = null, ?string $toDate = null): int
    {
        $query = StockBatch::available();

        if ($fromDate && $toDate) {
            $today = Carbon::today();
            $rangeStart = Carbon::parse($fromDate);
            $rangeEnd = Carbon::parse($toDate);

            // Effect: items that expired in the past part of the selected range
            $effectiveEnd = $rangeEnd->min($today);
            if ($rangeStart->gt($effectiveEnd)) return 0;

            $query->whereBetween('expiry_date', [$rangeStart->toDateString(), $effectiveEnd->toDateString()]);
        } else {
            $query->where('expiry_date', '<=', Carbon::today());
        }

        return (int) $query->count();
    }

    /**
     * Safely clear only the inventory report cache.
     */
    public function refresh(): JsonResponse
    {
        if (Cache::getStore() instanceof \Illuminate\Cache\TaggableStore) {
            Cache::tags(['inventory', 'reports', 'stock', 'medicines'])->flush();
        } else {
            Cache::flush();
        }

        return response()->json([
            'success' => true,
            'message' => 'Inventory report cache refreshed',
        ]);
    }
}
