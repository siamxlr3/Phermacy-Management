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

        $fromDate = $request->get('from_date', Carbon::now()->toDateString());
        $toDate = $request->get('to_date', Carbon::now()->addDays(90)->toDateString());

        $cacheKey = "inventory_v2_" . md5($fromDate . $toDate);

        $data = Cache::remember($cacheKey, 3600, function() use ($toDate) {
            
            // 1. Valuation and Medicine Stats
            $valuationData = $this->getValuationByCategory();
            
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
                'expiry_risks' => $this->getExpiryRisks($toDate),
                'dues'         => $this->getOutstandingDues(),
                'slow_moving'  => $slowMoving,
                'low_stock'    => $lowStockItems,
                'summaries'    => [
                    'total_stock_value'      => (float) $valuationData['total_value'],
                    'total_pending_payments' => (float) $this->getPendingPaymentsTotal(),
                    'expiry_count'           => (int) $this->getExpiryCount(90),
                    'expired_count'          => (int) $this->getExpiredCount(),
                    'low_stock_count'        => (int) $lowStockItems->count(),
                    'total_items'            => (int) $valuationData['total_unique'],
                ],
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * Categorized stock valuation with optimized SQL math.
     */
    private function getValuationByCategory(): array
    {

        $valuation = StockBatch::available()
            ->join('medicines', 'stock_batches.medicine_id', '=', 'medicines.id')
            ->selectRaw('
                IFNULL(medicines.category, "Uncategorized") as category_name,
                SUM(stock_batches.total_cost_value) as total_value,
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
    private function getExpiryRisks($toDate): array
    {
        return [
            'critical' => StockBatchResource::collection(StockBatch::available()
                ->whereBetween('expiry_date', [Carbon::tomorrow(), Carbon::today()->addDays(30)])
                ->with(['medicine:id,medicine_name', 'supplier:id,name'])
                ->orderBy('expiry_date')
                ->limit(50)
                ->get()),
            'warning' => StockBatchResource::collection(StockBatch::available()
                ->where('expiry_date', '<=', $toDate)
                ->with(['medicine:id,medicine_name', 'supplier:id,name'])
                ->orderBy('expiry_date', 'asc')
                ->limit(100)
                ->get()),
        ];
    }

    /**
     * Efficient retrieval of balance dues, fetching only required columns.
     */
    private function getOutstandingDues()
    {
        return PurchaseOrder::with('supplier:id,name')
            ->select(['id', 'supplier_id', 'total_amount', 'paid_amount', 'order_date'])
            ->where('status', '!=', PurchaseOrder::STATUS_CANCELLED)
            ->where('payment_status', '!=', PurchaseOrder::PAYMENT_STATUS_PAID)
            ->whereRaw('total_amount > paid_amount')
            ->orderBy('order_date')
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

    private function getPendingPaymentsTotal(): float
    {
        return (float) PurchaseOrder::where('status', '!=', PurchaseOrder::STATUS_CANCELLED)
            ->where('payment_status', '!=', PurchaseOrder::PAYMENT_STATUS_PAID)
            ->sum(DB::raw('total_amount - paid_amount'));
    }

    private function getExpiryCount($days): int
    {
        return (int) StockBatch::available()->expiringSoon($days)->count();
    }

    private function getExpiredCount(): int
    {
        return (int) StockBatch::available()->where('expiry_date', '<=', Carbon::today())->count();
    }

    /**
     * Safely clear only the inventory report cache.
     */
    public function refresh(): JsonResponse
    {
        Cache::flush();

        return response()->json([
            'success' => true,
            'message' => 'Inventory report cache refreshed',
        ]);
    }
}
