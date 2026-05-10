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
        
        $start = Carbon::parse($fromDate)->startOfDay()->toDateTimeString();
        $end = Carbon::parse($toDate)->endOfDay()->toDateTimeString();

        $cacheKey = "reports_" . md5($start . $end);

        $data = Cache::tags(['reports'])->remember($cacheKey, 600, function() use ($start, $end) {
            $summary = Sale::where('status', 'Completed')
                ->whereBetween('sale_date', [$start, $end])
                ->selectRaw('
                    COUNT(*) as total_transactions,
                    SUM(subtotal) as total_revenue,
                    SUM(tax_total) as total_tax,
                    SUM(discount_total) as total_discount,
                    SUM(grand_total) as total_receivable,
                    SUM(due_amount) as total_due
                ')
                ->first();

            $lowStock = Medicine::where('status', 'Active')
                ->whereColumn('stock', '<=', 'reorder_level')
                ->select('name', 'stock as qty')
                ->limit(5)
                ->get();

            $expiring = StockBatch::join('medicines', 'stock_batches.medicine_id', '=', 'medicines.id')
                ->where('stock_batches.qty_tablets_remaining', '>', 0)
                ->where('stock_batches.expiry_date', '<=', Carbon::now()->addMonths(6))
                ->select('medicines.name', 'stock_batches.expiry_date as date')
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

            $cashInHand = 0;
            if (Schema::hasTable('cash_registers')) {
                $cashInHand = CashRegister::where('status', 'Open')
                    ->orderByDesc('opened_at')
                    ->value('expected_cash') ?? 0;
            }

            $totalStockValue = StockBatch::where('qty_tablets_remaining', '>', 0)
                ->selectRaw('SUM(qty_tablets_remaining * cost_per_tablet) as total')
                ->value('total');

            $totalPurchaseCost = PurchaseOrder::whereBetween('order_date', [$start, $end])
                ->sum('total_amount');

            $estimatedProfit = SaleItem::join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->join('medicines', 'sale_items.medicine_id', '=', 'medicines.id')
                ->where('sales.status', 'Completed')
                ->whereBetween('sales.sale_date', [$start, $end])
                ->selectRaw('SUM(sale_items.subtotal - (sale_items.qty_tablets * IFNULL(medicines.cost_price, 0))) as profit')
                ->value('profit');

            return [
                'summary' => $summary,
                'remaining_due' => $summary->total_due ?? 0,
                'cash_in_hand' => $cashInHand,
                'low_stock_items' => $lowStock,
                'expiring_items' => $expiring,
                'supplier_dues' => $supplierDues,
                'total_supplier_due' => $totalSupplierDue ?? 0,
                'total_stock_value' => $totalStockValue ?? 0,
                'total_purchase_cost' => $totalPurchaseCost,
                'estimated_profit' => $estimatedProfit ?? 0,

                'daily_sales' => Sale::where('status', 'Completed')
                    ->whereBetween('sale_date', [$start, $end])
                    ->selectRaw('DATE(sale_date) as date, SUM(grand_total) as total, COUNT(*) as count')
                    ->groupBy('date')
                    ->orderBy('date')
                    ->get(),

                'top_medicines' => SaleItem::selectRaw('
                        medicines.id,
                        medicines.name,
                        SUM(sale_items.qty_tablets) as total_qty,
                        SUM(sale_items.subtotal) as total_revenue
                    ')
                    ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                    ->join('medicines', 'sale_items.medicine_id', '=', 'medicines.id')
                    ->where('sales.status', 'Completed')
                    ->whereBetween('sales.sale_date', [$start, $end])
                    ->groupBy('medicines.id', 'medicines.name')
                    ->orderByDesc('total_qty')
                    ->limit(10)
                    ->get(),

                'categories' => SaleItem::selectRaw('
                        IFNULL(medicines.category_name, "Uncategorized") as category_name,
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
