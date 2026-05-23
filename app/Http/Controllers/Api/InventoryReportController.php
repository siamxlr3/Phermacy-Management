<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StockBatch;
use App\Models\Medicine;
use App\Models\PurchaseOrder;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class InventoryReportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'from_date' => 'nullable|date',
            'to_date' => 'nullable|date|after_or_equal:from_date',
        ]);

        $fromDate = $request->get('from_date', Carbon::now()->toDateString());
        $toDate = $request->get('to_date', Carbon::now()->addDays(90)->toDateString());

        $cacheKey = "inventory_v2_" . md5($fromDate . $toDate);

        $data = Cache::tags(['inventory', 'dashboard'])->remember($cacheKey, 3600, function() use ($fromDate, $toDate) {

            // 1. Precise Stock Valuation (The Source of Truth)
            $valuation = StockBatch::where('qty_tablets_remaining', '>', 0)
                ->join('medicines', 'stock_batches.medicine_id', '=', 'medicines.id')
                ->selectRaw('
                    IFNULL(medicines.category, "Uncategorized") as category_name,
                    SUM(
                        CASE 
                            WHEN medicines.dosage_form IN ("Tablet", "Capsule", "Suppository", "Patch") 
                            THEN (stock_batches.qty_tablets_remaining / (IFNULL(medicines.tablets_per_strip, 1) * IFNULL(medicines.strips_per_box, 1))) * IFNULL(stock_batches.cost_per_box, 0)
                            ELSE stock_batches.qty_tablets_remaining * IFNULL(NULLIF(stock_batches.cost_per_unit, 0), stock_batches.cost_per_box / (stock_batches.qty_tablets / IFNULL(NULLIF(stock_batches.qty_boxes, 0), 1)))
                        END
                    ) as total_value,
                    COUNT(DISTINCT medicines.id) as unique_medicines,
                    SUM(stock_batches.qty_tablets_remaining) as total_tablets
                ')
                ->groupBy('category_name')
                ->orderByDesc('total_value')
                ->get();

            // 2. Outstanding Debts (Optimized Aggregation)
            $poDues = PurchaseOrder::where('status', '!=', 'Cancelled')
                ->where('payment_status', '!=', 'Paid')
                ->whereRaw('total_amount > paid_amount')
                ->sum(DB::raw('total_amount - paid_amount'));

            // 3. Consolidated Expiry & Risk Counts (One Query)
            $stockCounts = StockBatch::where('qty_tablets_remaining', '>', 0)
                ->selectRaw('
                    SUM(CASE WHEN expiry_date BETWEEN ? AND ? THEN 1 ELSE 0 END) as expiry_count,
                    SUM(CASE WHEN expiry_date BETWEEN ? AND ? THEN 1 ELSE 0 END) as critical_count,
                    SUM(CASE WHEN expiry_date <= ? THEN 1 ELSE 0 END) as expired_count
                ', [
                    Carbon::tomorrow()->toDateString(),
                    Carbon::today()->addDays(90)->toDateString(),
                    Carbon::tomorrow()->toDateString(),
                    Carbon::today()->addDays(30)->toDateString(),
                    Carbon::today()->toDateString(),
                ])
                ->first();

            // 4. Slow-Moving Inventory (Optimized using whereNotExists)
            $slowMoving = Medicine::where('stock', '>', 0)
                ->whereNotExists(function ($query) {
                    $query->select(DB::raw(1))
                        ->from('sale_items')
                        ->whereRaw('sale_items.medicine_id = medicines.id')
                        ->where('created_at', '>=', now()->subDays(90));
                })
                ->select('id', 'medicine_name as name', 'stock', 'reorder_level')
                ->orderByDesc('stock')
                ->limit(20)
                ->get();

            return [
                'valuation' => $valuation->map(fn($v) => [
                    'category' => (string) $v->category_name,
                    'value'    => (float) $v->total_value,
                    'medicines'=> (int) $v->unique_medicines,
                    'qty'      => (int) $v->total_tablets
                ]),

                'expiry_risks' => [
                    'critical' => StockBatch::where('qty_tablets_remaining', '>', 0)
                        ->whereBetween('expiry_date', [Carbon::tomorrow(), Carbon::today()->addDays(30)])
                        ->with(['medicine:id,medicine_name', 'supplier:id,name'])
                        ->orderBy('expiry_date')
                        ->limit(50)
                        ->get(),
                    'warning' => StockBatch::where('qty_tablets_remaining', '>', 0)
                        ->where('expiry_date', '<=', $toDate)
                        ->with(['medicine:id,medicine_name', 'supplier:id,name'])
                        ->orderBy('expiry_date', 'asc')
                        ->limit(100)
                        ->get(),
                ],

                'dues' => PurchaseOrder::with('supplier:id,name')
                    ->where('status', '!=', 'Cancelled')
                    ->where('payment_status', '!=', 'Paid')
                    ->whereRaw('total_amount > paid_amount')
                    ->orderBy('order_date')
                    ->get()
                    ->map(fn($po) => [
                        'id' => $po->id,
                        'supplier' => [
                            'name' => $po->supplier?->name
                        ],
                        'order_date' => $po->order_date?->toDateString(),
                        'total_amount' => (float) $po->total_amount,
                        'paid_amount' => (float) $po->paid_amount,
                        'balance_due' => (float) ($po->total_amount - $po->paid_amount),
                    ]),

                'slow_moving' => $slowMoving,

                'low_stock' => Medicine::active()
                    ->whereColumn('stock', '<=', 'reorder_level')
                    ->select('id', 'medicine_name', 'stock', 'reorder_level')
                    ->orderBy('stock', 'asc')
                    ->get(),

                'summaries' => [
                    'total_stock_value'      => (float) $valuation->sum('total_value'),
                    'total_pending_payments' => (float) $poDues,
                    'expiry_count'           => (int) ($stockCounts->expiry_count ?? 0),
                    'expired_count'          => (int) ($stockCounts->expired_count ?? 0),
                    'low_stock_count'        => (int) Medicine::active()->whereColumn('stock', '<=', 'reorder_level')->count(),
                    'total_items'            => (int) $valuation->sum('unique_medicines'),
                ],
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * Safely clear only the inventory report cache without affecting other system caches.
     */
    public function refresh(): JsonResponse
    {
        // FIX 8: Tag-based flush — NEVER use Cache::flush() in production
        Cache::tags(['inventory'])->flush();

        return response()->json([
            'success' => true,
            'message' => 'Inventory cache refreshed safely',
        ]);
    }
}
