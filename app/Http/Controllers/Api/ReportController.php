<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Medicine;
use App\Models\StockBatch;
use App\Models\PurchaseOrder;
use App\Models\CashRegister;
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
        
        $start = Carbon::parse($fromDate)->startOfDay();
        $end = Carbon::parse($toDate)->endOfDay();

        $cacheKey = "reports_" . md5($start . $end);

        $data = Cache::tags(['reports'])->remember($cacheKey, 600, function() use ($start, $end) {
            $summary = Sale::whereIn('status', ['Completed', 'Due', 'Partially Returned'])
                ->whereBetween('sale_date', [$start, $end])
                ->selectRaw('
                    COUNT(*) as total_transactions,
                    SUM(grand_total - COALESCE(refunded_amount, 0)) as total_revenue,
                    SUM(tax_total) as total_tax,
                    SUM(discount_total) as total_discount,
                    SUM(grand_total - COALESCE(refunded_amount, 0)) as total_receivable,
                    SUM(due_amount) as total_due,
                    SUM(CASE WHEN status IN ("Completed","Partially Returned") THEN grand_total - COALESCE(refunded_amount, 0) ELSE 0 END) as total_completed
                ')
                ->first();

            $lowStock = Medicine::where('is_active', 1)
                ->whereColumn('stock', '<=', 'reorder_level')
                ->select('medicine_name', 'stock as qty')
                ->limit(5)
                ->get();

            $expiring = StockBatch::join('medicines', 'stock_batches.medicine_id', '=', 'medicines.id')
                ->where('stock_batches.qty_tablets_remaining', '>', 0)
                ->whereBetween('stock_batches.expiry_date', [Carbon::today(), Carbon::today()->addDays(90)])
                ->select('medicines.medicine_name', 'stock_batches.expiry_date as date')
                ->orderBy('stock_batches.expiry_date')
                ->limit(5)
                ->get();

            $supplierDues = PurchaseOrder::join('suppliers', 'purchase_orders.supplier_id', '=', 'suppliers.id')
                ->where('purchase_orders.payment_status', '!=', 'Paid')
                ->select('suppliers.name', DB::raw('SUM(total_amount - paid_amount) as amount'))
                ->groupBy('suppliers.id', 'suppliers.name')
                ->orderByDesc('amount')
                ->limit(5)
                ->get();

            $totalSupplierDue = PurchaseOrder::where('payment_status', '!=', 'Paid')
                ->selectRaw('SUM(total_amount - paid_amount) as total')
                ->value('total');

            // Align with CashRegisterPage
            $cashInHand = \App\Models\CashTransaction::getCurrentBalance();

            // Align with InventoryReportsPage valuation logic
            $totalStockValue = (float) PurchaseOrder::where('status', '!=', 'Cancelled')->sum('paid_amount');

            $totalPurchaseCost = PurchaseOrder::whereBetween('order_date', [$start, $end])
                ->sum('total_amount');

            $estimatedProfit = SaleItem::join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->join('medicines', 'sale_items.medicine_id', '=', 'medicines.id')
                ->where('sales.status', 'Completed')
                ->whereBetween('sales.sale_date', [$start, $end])
                ->selectRaw('SUM(sale_items.subtotal - (sale_items.qty_tablets * IFNULL(medicines.cost_price, 0))) as profit')
                ->value('profit');

            $returnsCount = \App\Models\SalesReturn::whereBetween('return_date', [$start, $end])->count();

            return [
                'summary' => $summary,
                'total_transactions' => (int) ($summary->total_transactions ?? 0),
                'remaining_due' => (float) ($summary->total_due ?? 0),
                'cash_in_hand' => (float) $cashInHand,
                'returns_count' => $returnsCount,
                'low_stock_items' => $lowStock,
                'expiring_items' => $expiring,
                'supplier_dues' => $supplierDues,
                'total_supplier_due' => (float) ($totalSupplierDue ?? 0),
                'total_stock_value' => (float) ($totalStockValue ?? 0),
                'total_purchase_cost' => (float) $totalPurchaseCost,
                'estimated_profit' => (float) ($estimatedProfit ?? 0),

                'daily_sales' => Sale::where('status', 'Completed')
                    ->whereBetween('sale_date', [$start, $end])
                    ->selectRaw('DATE(sale_date) as date, SUM(grand_total) as total, COUNT(*) as count')
                    ->groupBy('date')
                    ->orderBy('date')
                    ->get(),

                'monthly_revenue' => Sale::where('status', 'Completed')
                    ->whereYear('sale_date', date('Y'))
                    ->selectRaw('MONTH(sale_date) as month, SUM(grand_total) as revenue')
                    ->groupBy('month')
                    ->orderBy('month')
                    ->get(),

                'top_medicines' => SaleItem::selectRaw('
                        medicines.id,
                        medicines.medicine_name,
                        SUM(sale_items.qty_tablets) as total_qty,
                        SUM(sale_items.subtotal) as total_revenue
                    ')
                    ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                    ->join('medicines', 'sale_items.medicine_id', '=', 'medicines.id')
                    ->where('sales.status', 'Completed')
                    ->whereBetween('sales.sale_date', [$start, $end])
                    ->groupBy('medicines.id', 'medicines.medicine_name')
                    ->orderByDesc('total_qty')
                    ->limit(10)
                    ->get(),

                'categories' => SaleItem::selectRaw('
                        IFNULL(medicines.category, "Uncategorized") as category_name,
                        SUM(sale_items.subtotal) as total_revenue,
                        COUNT(sale_items.id) as total_items
                    ')
                    ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                    ->join('medicines', 'sale_items.medicine_id', '=', 'medicines.id')
                    ->where('sales.status', 'Completed')
                    ->whereBetween('sales.sale_date', [$start, $end])
                    ->groupBy('category_name')
                    ->orderByDesc('total_revenue')
                    ->get(),

                'payments' => Sale::where('status', 'Completed')
                    ->whereBetween('sale_date', [$start, $end])
                    ->selectRaw('payment_method, SUM(grand_total) as total, COUNT(*) as count')
                    ->groupBy('payment_method')
                    ->get(),

                'date_range' => ['from' => $start, 'to' => $end]
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
