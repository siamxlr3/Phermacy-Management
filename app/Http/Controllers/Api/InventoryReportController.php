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
        // FIX 1: Validate date inputs — prevent Carbon 500 crashes on bad input
        $request->validate([
            'from_date' => 'nullable|date',
            'to_date' => 'nullable|date|after_or_equal:from_date',
        ]);

        $fromDate = $request->get('from_date', Carbon::now()->toDateString());
        $toDate = $request->get('to_date', Carbon::now()->addDays(90)->toDateString());

        $cacheKey = "inventory_" . md5($fromDate . $toDate);

        // FIX 2: Use Cache Tags for safe, scoped invalidation without touching other caches
        $data = Cache::tags(['inventory'])->remember($cacheKey, 3600, function() use ($fromDate, $toDate) {

            // Stock valuation grouped by category
            $valuation = StockBatch::where('qty_tablets_remaining', '>', 0)
                ->join('medicines', 'stock_batches.medicine_id', '=', 'medicines.id')
                ->selectRaw('
                    IFNULL(medicines.category_name, "Uncategorized") as category_name,
                    SUM(
                        CASE 
                            WHEN medicines.dosage_form IN ("Tablet", "Capsule", "Suppository", "Patch") 
                            THEN (stock_batches.qty_tablets_remaining / (IFNULL(medicines.tablet_per_stripe, 1) * IFNULL(medicines.stripe_per_box, 1))) * IFNULL(stock_batches.cost_per_box, 0)
                            ELSE stock_batches.qty_tablets_remaining * IFNULL(stock_batches.price, 0)
                        END
                    ) as total_value,
                    COUNT(DISTINCT medicines.id) as unique_medicines,
                    SUM(stock_batches.qty_tablets_remaining) as total_tablets
                ')
                ->groupBy('category_name')
                ->orderByDesc('total_value')
                ->get();

            // Total outstanding PO payment dues
            $poDues = PurchaseOrder::where('status', '!=', 'Cancelled')
                ->where('payment_status', '!=', 'Paid')
                ->whereRaw('total_amount > paid_amount')
                ->sum(DB::raw('total_amount - paid_amount'));

            // FIX 3: Replace pluck()->unique() with a DB subquery — prevents loading
            // potentially millions of IDs into PHP memory
            $soldRecentlySubquery = DB::table('sale_items')
                ->where('created_at', '>=', now()->subDays(90))
                ->select('medicine_id')
                ->distinct();

            // FIX 4: Combine 3 separate COUNT queries into ONE aggregation query
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

            return [
                'valuation' => $valuation,

                'expiry_risks' => [
                    // FIX 5: Added ->limit() safety cap to prevent OOM on large datasets
                    'critical' => StockBatch::where('qty_tablets_remaining', '>', 0)
                        ->whereBetween('expiry_date', [
                            Carbon::tomorrow()->toDateString(),
                            Carbon::today()->addDays(30)->toDateString(),
                        ])
                        ->with(['medicine', 'supplier'])
                        ->orderBy('expiry_date')
                        ->limit(100)
                        ->get(),

                    'warning' => StockBatch::where('qty_tablets_remaining', '>', 0)
                        ->whereBetween('expiry_date', [$fromDate, $toDate])
                        ->with(['medicine', 'supplier'])
                        ->orderBy('expiry_date')
                        ->limit(100)
                        ->get(),
                ],

                'dues' => PurchaseOrder::with('supplier')
                    ->where('status', '!=', 'Cancelled')
                    ->where('payment_status', '!=', 'Paid')
                    ->whereRaw('total_amount > paid_amount')
                    ->selectRaw('*, (total_amount - paid_amount) as balance_due')
                    ->orderByDesc('balance_due')
                    ->limit(50) // Safety cap for dues list
                    ->get(),

                // FIX 6: DB subquery replaces PHP-side pluck/unique memory pattern
                'slow_moving' => Medicine::where('stock', '>', 0)
                    ->whereNotIn('id', $soldRecentlySubquery)
                    ->select('id', 'name', 'stock', 'reorder_level')
                    ->orderByDesc('stock')
                    ->limit(50)
                    ->get(),

                'summaries' => [
                    'total_stock_value' => $valuation->sum('total_value'),
                    'total_pending_payments' => (float) $poDues,
                    // FIX 7: All counts now come from the single aggregation query above
                    'expiry_count' => (int) ($stockCounts->expiry_count ?? 0),
                    'expired_count' => (int) ($stockCounts->expired_count ?? 0),
                    'low_stock_count' => Medicine::where('status', 'Active')
                        ->whereColumn('stock', '<=', 'reorder_level')
                        ->count(),
                    'category_count' => $valuation->count(),
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
