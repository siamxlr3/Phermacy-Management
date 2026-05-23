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

        $data = Cache::tags(['reports', 'dashboard'])->remember($cacheKey, 600, function() use ($start, $end, $fromDate, $toDate, $trendYear, $trendFromMonth, $trendToMonth) {
            
            // 1. Consolidated Sales & Returns Summary (One Query)
            $salesSummary = Sale::whereBetween('sale_date', [$start, $end])
                ->selectRaw("
                    COUNT(*) as total_transactions,
                    SUM(CASE WHEN status NOT IN ('Cancelled') THEN grand_total ELSE 0 END) as total_revenue,
                    SUM(COALESCE(refunded_subtotal, 0)) as total_returns,
                    SUM(grand_total) as total_sales,
                    SUM(tax_total) as total_tax,
                    SUM(discount_total) as total_discount,
                    SUM(due_amount) as total_due,
                    COUNT(CASE WHEN status IN ('Returned', 'Partially Returned') THEN 1 END) as returns_count
                ")
                ->first();

            // 2. Consolidated Purchase Cost (Filtered by date)
            $purchaseCost = PurchaseOrder::whereBetween('order_date', [$start, $end])
                ->sum('total_amount');

            // 3. Global Supplier Due (Total outstanding balance regardless of date)
            $globalSupplierDue = PurchaseOrder::selectRaw('SUM(total_amount - paid_amount) as total_due')
                ->value('total_due') ?? 0;

            // 3. CORRECT Stock Valuation (Based on actual stock batches and precise unit conversion)
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

            // 4. Corrected Profit Calculation (Net Revenue - Expenses - Stock Valuation)
            $totalRevenue = (float) ($salesSummary->total_revenue ?? 0);
            $totalExpenses = (float) \App\Models\Expense::whereBetween('expense_date', [$start, $end])->sum('grand_total');
            $estimatedProfit = $totalRevenue - $totalExpenses - (float) $inventoryValuation;

            // 5. Critical Inventory Alerts
            $lowStock = Medicine::active()
                ->whereColumn('stock', '<=', 'reorder_level')
                ->select('id', 'medicine_name', 'stock as qty', 'reorder_level')
                ->orderBy('stock', 'asc')
                ->get();

            $expiring = StockBatch::join('medicines', 'stock_batches.medicine_id', '=', 'medicines.id')
                ->where('stock_batches.qty_tablets_remaining', '>', 0)
                ->whereBetween('stock_batches.expiry_date', [Carbon::today(), Carbon::today()->addDays(90)])
                ->select('medicines.medicine_name', 'stock_batches.expiry_date as date', 'stock_batches.qty_tablets_remaining as qty')
                ->orderBy('stock_batches.expiry_date')
                ->limit(50)
                ->get();

            // 6. Top Performers & Trends
            $topMedicines = SaleItem::selectRaw('
                    medicines.medicine_name,
                    medicines.generic_name,
                    medicines.dosage_form,
                    SUM(sale_items.qty_tablets) as total_qty,
                    SUM(sale_items.subtotal) as total_revenue
                ')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->join('medicines', 'sale_items.medicine_id', '=', 'medicines.id')
                ->where('sales.status', 'Completed')
                ->whereBetween('sales.sale_date', [$start, $end])
                ->groupBy('medicines.id', 'medicines.medicine_name', 'medicines.generic_name', 'medicines.dosage_form')
                ->orderByDesc('total_qty')
                ->limit(5)
                ->get();

            return [
                'summary' => [
                    'total_transactions' => (int) ($salesSummary->total_transactions ?? 0),
                    'total_revenue'      => (float) ($salesSummary->total_revenue ?? 0),
                    'total_sales'        => (float) ($salesSummary->total_sales ?? 0),
                    'total_returns'      => (float) ($salesSummary->total_returns ?? 0),
                    'total_tax'          => (float) ($salesSummary->total_tax ?? 0),
                    'total_discount'     => (float) ($salesSummary->total_discount ?? 0),
                    'remaining_due'      => (float) ($salesSummary->total_due ?? 0),
                    'returns_count'      => (int) ($salesSummary->returns_count ?? 0),
                    'cash_in_hand'       => (float) CashTransaction::getCurrentBalance(),
                    'total_stock_value'  => (float) ($inventoryValuation ?? 0),
                    'total_purchase_cost'=> (float) ($purchaseCost ?? 0),
                    'total_supplier_due' => (float) ($globalSupplierDue ?? 0),
                    'total_expenses'     => (float) ($totalExpenses ?? 0),
                    'estimated_profit'   => (float) ($estimatedProfit ?? 0),
                ],
                'alerts' => [
                    'low_stock' => $lowStock,
                    'expiring'  => $expiring,
                ],
                'charts' => [
                    'daily_sales' => Sale::whereNotIn('status', ['Cancelled'])
                        ->whereBetween('sale_date', [$start, $end])
                        ->selectRaw("DATE(sale_date) as date, SUM(grand_total) as total")
                        ->groupBy('date')
                        ->orderBy('date')
                        ->get(),
                ],
                'top_medicines' => $topMedicines,
                'categories' => SaleItem::join('sales', 'sale_items.sale_id', '=', 'sales.id')
                    ->join('medicines', 'sale_items.medicine_id', '=', 'medicines.id')
                    ->whereIn('sales.status', ['Completed', 'Partially Returned'])
                    ->whereBetween('sales.sale_date', [$start, $end])
                    ->selectRaw('medicines.category as category_name, SUM(sale_items.subtotal) as total_revenue, COUNT(sale_items.id) as total_items')
                    ->groupBy('medicines.category')
                    ->orderByDesc('total_revenue')
                    ->get(),
                'monthly_revenue' => Sale::whereNotIn('status', ['Cancelled'])
                    ->whereYear('sale_date', $trendYear)
                    ->whereRaw('MONTH(sale_date) BETWEEN ? AND ?', [$trendFromMonth, $trendToMonth])
                    ->selectRaw("MONTH(sale_date) as month, SUM(grand_total) as revenue")
                    ->groupBy('month')
                    ->orderBy('month')
                    ->get(),
                'payments' => Sale::where('status', 'Completed')
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
        Cache::tags(['reports'])->flush();

        return response()->json([
            'success' => true,
            'message' => 'Report cache cleared safely'
        ]);
    }
}
