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
                ->selectRaw("
                    COUNT(*) as total_transactions,
                    SUM(CASE WHEN status IN ('Completed','Partially Returned','Returned')
                        THEN grand_total - COALESCE(refunded_subtotal, 0) ELSE 0 END) as total_revenue,
                    SUM(grand_total) as total_sales,
                    SUM(due_amount) as total_due
                ")
                ->first();

            // 2. Optimized Best Selling (Using Join instead of whereHas)
            $bestSelling = SaleItem::join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->join('medicines', 'sale_items.medicine_id', '=', 'medicines.id')
                ->whereBetween('sales.sale_date', [$start, $end])
                ->whereIn('sales.status', ['Completed', 'Partially Returned', 'Returned'])
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

            // 4. Corrected Profit Calculation (Net Revenue - Expenses - Stock Valuation)
            $totalRevenue = (float) ($salesSummary->total_revenue ?? 0);
            $totalSales = (float) ($salesSummary->total_sales ?? 0);
            $totalPurchaseCost = (float) \App\Models\PurchaseOrder::whereBetween('order_date', [$start, $end])->sum('total_amount');
            $totalExpenses = (float) \App\Models\Expense::whereBetween('expense_date', [$start, $end])->sum('grand_total');
            $inventoryValuation = StockBatch::where('qty_tablets_remaining', '>', 0)
                ->join('medicines', 'stock_batches.medicine_id', '=', 'medicines.id')
                ->selectRaw('
                    SUM(
                        CASE 
                            WHEN medicines.dosage_form IN ("Tablet", "Capsule", "Suppository", "Patch") 
                            THEN (stock_batches.qty_tablets_remaining / (IFNULL(medicines.tablets_per_strip, 1) * IFNULL(medicines.strips_per_box, 1))) * IFNULL(stock_batches.cost_per_box, 0)
                            ELSE stock_batches.qty_tablets_remaining * IFNULL(NULLIF(stock_batches.cost_per_unit, 0), stock_batches.cost_per_box / (stock_batches.qty_tablets / IFNULL(NULLIF(stock_batches.qty_boxes, 0), 1)))
                        END
                    ) as total_value
                ')
                ->value('total_value') ?? 0;
            $estimatedProfit = $totalRevenue - $totalExpenses - (float) $inventoryValuation;

            // 5. Monthly Revenue Trend (Optimized Year Filter)
            $monthlyRevenue = Sale::whereYear('sale_date', $now->year)
                ->whereIn('status', ['Completed', 'Partially Returned', 'Returned'])
                ->selectRaw('MONTH(sale_date) as month, SUM(grand_total - COALESCE(refunded_subtotal, 0)) as revenue')
                ->groupBy('month')
                ->orderBy('month')
                ->get();

            return [
                'metrics' => [
                    'total_sales'         => $totalSales,
                    'total_revenue'       => $totalRevenue,
                    'total_transactions'  => (int) ($salesSummary->total_transactions ?? 0),
                    'remaining_due'       => (float) ($salesSummary->total_due ?? 0),
                    'cash_in_hand'        => (float) CashTransaction::getCurrentBalance(),
                    'stock_value'         => (float) $inventoryValuation,
                    'purchase_cost'       => $totalPurchaseCost,
                    'total_expenses'      => $totalExpenses,
                    'estimated_profit'    => (float) $estimatedProfit,
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
