<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Medicine;
use App\Models\StockBatch;
use App\Models\PurchaseOrder;
use App\Models\CashRegister;
use App\Models\CashTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $request->validate([
            'from_date' => 'nullable|date',
            'to_date' => 'nullable|date|after_or_equal:from_date',
        ]);

        $fromDate = $request->get('from_date', Carbon::now()->subDays(30)->toDateString());
        $toDate = $request->get('to_date', Carbon::now()->toDateString());

        // Separate trend filter params
        $trendYear       = (int) $request->get('trend_year', now()->year);
        $trendFromMonth  = (int) $request->get('trend_from_month', 1);
        $trendToMonth    = (int) $request->get('trend_to_month', 12);
        
        $start = Carbon::parse($fromDate)->startOfDay();
        $end = Carbon::parse($toDate)->endOfDay();

        // Unique cache key per date range + trend params
        $cacheKey = "dashboard_v2_" . md5($start . $end . $trendYear . $trendFromMonth . $trendToMonth);

        $data = Cache::remember($cacheKey, 600, function() use ($start, $end, $fromDate, $toDate, $trendYear, $trendFromMonth, $trendToMonth) {
            
            // 1. Consolidated Sales & Returns Summary (Optimized via Model)
            $salesSummary = Sale::getDashboardSummary($start, $end);

            // 2. Consolidated Purchase Cost
            $purchaseCost = PurchaseOrder::whereBetween('order_date', [$start, $end])
                ->sum('total_amount');

            // 3. Global Supplier Due
            $globalSupplierDue = PurchaseOrder::selectRaw('SUM(total_amount - paid_amount) as total_due')
                ->value('total_due') ?? 0;

            // 4. Live Inventory Valuation — same formula as InventoryReportController
            // Uses live SQL CASE to match the Inventory Reports page exactly.
            $inventoryValuation = StockBatch::available()
                ->join('medicines', 'stock_batches.medicine_id', '=', 'medicines.id')
                ->selectRaw('
                    SUM(
                        CASE
                            WHEN medicines.dosage_form IN ("Tablet", "Capsule", "Suppository", "Patch")
                            THEN (stock_batches.qty_tablets_remaining / (NULLIF(medicines.tablets_per_strip, 0) * NULLIF(medicines.strips_per_box, 0))) * IFNULL(stock_batches.cost_per_box, 0)
                            ELSE stock_batches.qty_tablets_remaining * IFNULL(NULLIF(stock_batches.cost_per_unit, 0), stock_batches.cost_per_box / (NULLIF(stock_batches.qty_tablets, 0) / NULLIF(stock_batches.qty_boxes, 1)))
                        END
                    ) as total_value
                ')
                ->value('total_value') ?? 0;

            // 5. Corrected Profit Calculation (Revenue - Expenses)
            $totalRevenue = (float) ($salesSummary->total_revenue ?? 0);
            $totalCogs = (float) ($salesSummary->total_cogs ?? 0);
            $totalExpenses = (float) \App\Models\Expense::whereBetween('expense_date', [$start, $end])->sum('grand_total');
            $estimatedProfit = $totalRevenue - $totalExpenses;
            $grossProfit = $totalRevenue - $totalCogs; // Kept for reference but not used in final profit


            // 6. Critical Inventory Alerts (Using Model Scopes)
            $lowStock = Medicine::getLowStockAlerts();
            $expiring = StockBatch::available()->expiringSoon(90)
                ->join('medicines', 'stock_batches.medicine_id', '=', 'medicines.id')
                ->select('medicines.medicine_name', 'stock_batches.expiry_date as date', 'stock_batches.qty_tablets_remaining as qty')
                ->orderBy('stock_batches.expiry_date')
                ->limit(50)
                ->get();

            // 7. Top Performers & Trends
            $topMedicines = Sale::getTopPerformers($start, $end);

            return [
                'summary' => [
                    'total_transactions' => (int) ($salesSummary->total_transactions ?? 0),
                    'total_revenue'      => $totalRevenue,
                    'total_sales'        => (float) ($salesSummary->total_sales ?? 0),
                    'total_returns'      => (float) ($salesSummary->total_returns ?? 0),
                    'total_tax'          => (float) ($salesSummary->total_tax ?? 0),
                    'total_discount'     => (float) ($salesSummary->total_discount ?? 0),
                    'remaining_due'      => (float) ($salesSummary->total_due ?? 0),
                    'returns_count'      => (int) ($salesSummary->returns_count ?? 0),
                    'cash_in_hand'       => (float) CashTransaction::getCurrentBalance(),
                    'total_stock_value'  => (float) $inventoryValuation,
                    'total_purchase_cost'=> (float) ($purchaseCost ?? 0),
                    'total_supplier_due' => (float) ($globalSupplierDue ?? 0),
                    'total_expenses'     => $totalExpenses,
                    'total_cogs'         => $totalCogs,
                    'gross_profit'       => $grossProfit,
                    'estimated_profit'   => (float) $estimatedProfit,
                ],
                'alerts' => [
                    'low_stock' => $lowStock,
                    'expiring'  => $expiring,
                ],
                'charts' => [
                    'daily_sales' => Sale::whereNotIn('status', [Sale::STATUS_CANCELLED])
                        ->whereBetween('sale_date', [$start, $end])
                        ->selectRaw("DATE(sale_date) as date, SUM(grand_total) as total")
                        ->groupBy('date')
                        ->orderBy('date')
                        ->get(),
                ],
                'top_medicines' => $topMedicines,
                'categories' => SaleItem::getTopCategories($start, $end),
                'monthly_revenue' => Sale::whereNotIn('status', [Sale::STATUS_CANCELLED])
                    ->whereYear('sale_date', $trendYear)
                    ->whereRaw('MONTH(sale_date) BETWEEN ? AND ?', [$trendFromMonth, $trendToMonth])
                    ->selectRaw("MONTH(sale_date) as month, SUM(grand_total) as revenue")
                    ->groupBy('month')
                    ->orderBy('month')
                    ->get(),
                'payments' => Sale::where('status', Sale::STATUS_COMPLETED)
                    ->whereBetween('sale_date', [$start, $end])
                    ->selectRaw("payment_method, SUM(grand_total) as total")
                    ->groupBy('payment_method')
                    ->get(),
                'date_range' => ['from' => $fromDate, 'to' => $toDate]
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Report generated successfully',
            'data' => $data
        ]);
    }

    /**
     * Clear and refresh report data safely
     */
    public function refresh(): JsonResponse
    {
        // Clear all dashboard cache keys (file driver doesn't support tags)
        Cache::flush();

        return response()->json([
            'success' => true,
            'message' => 'Report cache cleared safely'
        ]);
    }
}
