<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Medicine;
use App\Models\StockBatch;
use App\Models\PurchaseOrder;
use App\Models\Expense;
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
        // 1. Validation for robust API behavior
        $request->validate([
            'from_date' => 'nullable|date',
            'to_date'   => 'nullable|date|after_or_equal:from_date',
        ]);

        $fromDate = $request->input('from_date');
        $toDate = $request->input('to_date');

        $now = Carbon::now();
        $start = $fromDate ? Carbon::parse($fromDate)->startOfDay() : $now->copy()->startOfDay();
        $end = $toDate ? Carbon::parse($toDate)->endOfDay() : $now->copy()->endOfDay();

        // Unique cache key based on date range
        $cacheKey = "dashboard_metrics_" . md5($start->toDateTimeString() . $end->toDateTimeString());

        $data = Cache::remember($cacheKey, 600, function() use ($start, $end, $now) {
            
            // 2. Metrics Calculation
            $salesSummary = $this->getSalesSummary($start, $end);
            $bestSelling = $this->getBestSelling($start, $end);
            $lowStock = $this->getLowStockMetrics();
            $financials = $this->getFinancialMetrics($start, $end, $salesSummary);
            
            return [
                'metrics' => array_merge(
                    $salesSummary,
                    $financials,
                    $lowStock,
                    [
                        'cash_in_hand'        => (float) CashTransaction::getCurrentBalance(),
                        'expiring_soon_count' => (int) StockBatch::available()->expiringSoon(90)->count(),
                    ]
                ),
                'best_selling'    => $bestSelling,
                'low_stock_items' => $this->getLowStockItems(),
                'monthly_trend'   => $this->getMonthlyRevenueTrend($now),
                'payments'        => $this->getPaymentSummary($start, $end),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    /**
     * Get consolidated sales metrics in one query.
     */
    private function getSalesSummary($start, $end): array
    {
        $summary = Sale::whereBetween('sale_date', [$start, $end])
            ->selectRaw("
                COUNT(*) as total_transactions,
                SUM(CASE WHEN status NOT IN (?) THEN grand_total ELSE 0 END) as total_revenue,
                SUM(COALESCE(refunded_subtotal, 0)) as total_returns,
                SUM(grand_total) as total_sales_amount,
                SUM(due_amount) as remaining_due
            ", [Sale::STATUS_CANCELLED])
            ->first();

        return [
            'total_transactions' => (int) ($summary->total_transactions ?? 0),
            'total_revenue'      => (float) ($summary->total_revenue ?? 0),
            'total_returns'      => (float) ($summary->total_returns ?? 0),
            'total_sales'        => (float) ($summary->total_sales_amount ?? 0),
            'remaining_due'      => (float) ($summary->remaining_due ?? 0),
        ];
    }

    /**
     * Get Best Selling medicines using optimized Joins.
     */
    private function getBestSelling($start, $end)
    {
        return SaleItem::join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('medicines', 'sale_items.medicine_id', '=', 'medicines.id')
            ->whereBetween('sales.sale_date', [$start, $end])
            ->whereIn('sales.status', Sale::SUCCESS_STATUSES)
            ->selectRaw('
                sale_items.medicine_id, 
                medicines.medicine_name,
                medicines.generic_name,
                medicines.dosage_form,
                SUM(sale_items.qty_tablets) as total_qty, 
                SUM(sale_items.subtotal) as total_revenue
            ')
            ->groupBy('sale_items.medicine_id', 'medicines.medicine_name', 'medicines.generic_name', 'medicines.dosage_form')
            ->orderByDesc('total_qty')
            ->limit(5)
            ->get();
    }

    /**
     * Calculate COGS and Profit correctly.
     */
    private function getFinancialMetrics($start, $end, $salesSummary): array
    {
        $purchaseCost = (float) PurchaseOrder::whereBetween('order_date', [$start, $end])->sum('total_amount');
        $supplierDue = (float) PurchaseOrder::selectRaw('SUM(total_amount - paid_amount) as total_due')->value('total_due') ?? 0;
        $expenses = (float) Expense::whereBetween('expense_date', [$start, $end])->sum('grand_total');
        
        // COGS = Cost of items actually sold
        $cogs = (float) SaleItem::join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('stock_batches', 'sale_items.stock_batch_id', '=', 'stock_batches.id')
            ->whereBetween('sales.sale_date', [$start, $end])
            ->whereIn('sales.status', Sale::SUCCESS_STATUSES)
            ->sum(DB::raw('sale_items.qty_tablets * stock_batches.cost_per_unit'));

        $inventoryValue = $this->getInventoryValuation();

        // Net Profit = Revenue - Expenses
        $estimatedProfit = $salesSummary['total_revenue'] - $expenses;


        return [
            'purchase_cost'       => $purchaseCost,
            'total_supplier_due'  => $supplierDue,
            'total_expenses'      => $expenses,
            'stock_value'         => $inventoryValue,
            'estimated_profit'    => $estimatedProfit,
            'cogs'                => $cogs, // Added for transparency
        ];
    }

    /**
     * Efficient Inventory Valuation with caching fallback.
     */
    private function getInventoryValuation(): float
    {
        // This is a heavy query - consider indexing stock_batches on (qty_tablets_remaining, medicine_id)
        return (float) StockBatch::available()
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
    }

    private function getLowStockMetrics(): array
    {
        return [
            'low_stock_count' => Medicine::active()
                ->whereColumn('stock', '<=', 'reorder_level')
                ->count()
        ];
    }

    private function getLowStockItems()
    {
        return Medicine::active()
            ->whereColumn('stock', '<=', 'reorder_level')
            ->select('id', 'medicine_name', 'stock', 'reorder_level')
            ->orderBy('stock', 'asc')
            ->limit(5)
            ->get();
    }

    private function getMonthlyRevenueTrend($now)
    {
        // Optimized range filter to use index instead of whereYear
        return Sale::whereBetween('sale_date', [$now->copy()->startOfYear(), $now->copy()->endOfYear()])
            ->whereNotIn('status', [Sale::STATUS_CANCELLED])
            ->selectRaw('MONTH(sale_date) as month, SUM(grand_total) as revenue')
            ->groupBy('month')
            ->orderBy('month')
            ->get();
    }

    private function getPaymentSummary($start, $end)
    {
        return Sale::whereBetween('sale_date', [$start, $end])
            ->selectRaw('payment_method, SUM(grand_total) as total')
            ->groupBy('payment_method')
            ->get();
    }
}
