<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Medicine;
use App\Models\StockBatch;
use App\Models\GRN;
use App\Models\CashTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Get consolidated dashboard metrics with high-performance caching.
     */
    public function index(Request $request): JsonResponse
    {
        $fromDate = $request->input('from_date');
        $toDate = $request->input('to_date');

        $now = Carbon::now();
        $start = $fromDate ? Carbon::parse($fromDate)->startOfDay() : $now->copy()->startOfDay();
        $end = $toDate ? Carbon::parse($toDate)->endOfDay() : $now->copy()->endOfDay();

        // Unique cache key based on date range
        $cacheKey = "dashboard_metrics_" . md5($start . $end);

        $data = Cache::tags(['dashboard', 'sales', 'inventory'])->remember($cacheKey, 600, function() use ($start, $end, $now) {
            
            // 1. Consolidated Sales Summary (One Optimized Query)
            $salesSummary = Sale::whereBetween('sale_date', [$start, $end])
                ->whereIn('status', ['Completed', 'Due', 'Partially Returned', 'Returned'])
                ->selectRaw('
                    SUM(grand_total - COALESCE(refunded_subtotal, 0)) as net_sales,
                    SUM(due_amount) as total_due,
                    COUNT(*) as transaction_count
                ')
                ->first();

            // 2. Optimized Best Selling (Using Join instead of whereHas)
            $bestSelling = SaleItem::join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->join('medicines', 'sale_items.medicine_id', '=', 'medicines.id')
                ->whereBetween('sales.sale_date', [$start, $end])
                ->whereIn('sales.status', ['Completed', 'Partially Returned'])
                ->selectRaw('
                    sale_items.medicine_id, 
                    medicines.medicine_name,
                    SUM(sale_items.qty_tablets) as total_qty, 
                    SUM(sale_items.subtotal) as total_revenue
                ')
                ->groupBy('sale_items.medicine_id', 'medicines.medicine_name')
                ->orderByDesc('total_qty')
                ->limit(5)
                ->get();

            // 3. Consolidated Low Stock (One Query)
            $lowStockItems = Medicine::where('stock', '<=', DB::raw('reorder_level'))
                ->where('is_active', 1)
                ->select('id', 'medicine_name', 'stock', 'reorder_level')
                ->orderBy('stock', 'asc')
                ->limit(5)
                ->get();

            $lowStockCount = Medicine::where('is_active', 1)
                ->whereColumn('stock', '<=', 'reorder_level')
                ->count();

            // 4. Optimized COGS and Profit (Using Direct Join)
            $cogs = (float) SaleItem::join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->join('stock_batches', 'sale_items.stock_batch_id', '=', 'stock_batches.id')
                ->whereBetween('sales.sale_date', [$start, $end])
                ->whereIn('sales.status', ['Completed', 'Partially Returned'])
                ->sum(DB::raw('sale_items.qty_tablets * stock_batches.cost_per_unit'));

            $netSales = (float) ($salesSummary->net_sales ?? 0);

            // 5. Monthly Revenue Trend (Optimized Year Filter)
            $monthlyRevenue = Sale::whereYear('sale_date', $now->year)
                ->whereIn('status', ['Completed', 'Partially Returned'])
                ->selectRaw('MONTH(sale_date) as month, SUM(grand_total - COALESCE(refunded_subtotal, 0)) as revenue')
                ->groupBy('month')
                ->orderBy('month')
                ->get();

            return [
                'metrics' => [
                    'total_sales'         => (float) $netSales,
                    'total_transactions'  => (int) ($salesSummary->transaction_count ?? 0),
                    'remaining_due'       => (float) ($salesSummary->total_due ?? 0),
                    'cash_in_hand'        => (float) CashTransaction::getCurrentBalance(),
                    'stock_value'         => (float) Medicine::where('is_active', 1)->selectRaw('SUM(stock * cost_price) as total')->value('total'),
                    'purchase_cost'       => (float) GRN::whereBetween('received_date', [$start, $end])->sum('total_amount'),
                    'estimated_profit'    => (float) ($netSales - $cogs),
                    'low_stock_count'     => (int) $lowStockCount,
                    'expiring_soon_count' => (int) StockBatch::where('qty_tablets_remaining', '>', 0)
                                                ->whereBetween('expiry_date', [Carbon::now(), Carbon::now()->addDays(90)])
                                                ->count(),
                ],
                'best_selling'    => $bestSelling,
                'low_stock_items' => $lowStockItems,
                'monthly_trend'   => $monthlyRevenue,
                'payments'        => Sale::whereBetween('sale_date', [$start, $end])
                                        ->selectRaw('payment_method, SUM(grand_total) as total')
                                        ->groupBy('payment_method')
                                        ->get(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }
}
