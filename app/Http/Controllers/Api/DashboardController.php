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
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $fromDate = $request->input('from_date');
        $toDate = $request->input('to_date');

        // If no dates provided, default to current month for trending data, but "Today's Sale" should be today
        $now = Carbon::now();
        $start = $fromDate ? Carbon::parse($fromDate)->startOfDay() : $now->copy()->startOfDay();
        $end = $toDate ? Carbon::parse($toDate)->endOfDay() : $now->copy()->endOfDay();

        // 1. Today's Sale / Sales in Range — net of any refunds
        $salesQuery = Sale::whereBetween('sale_date', [$start, $end])
            ->whereIn('status', ['Completed', 'Due', 'Partially Returned']);
        $totalSales = (float) $salesQuery->selectRaw('SUM(grand_total - COALESCE(refunded_amount, 0))')->value('SUM(grand_total - COALESCE(refunded_amount, 0))');
        $totalTransactions = Sale::whereBetween('sale_date', [$start, $end])
            ->whereIn('status', ['Completed', 'Due', 'Partially Returned'])
            ->count();
        $remainingDue = (float) Sale::whereBetween('sale_date', [$start, $end])->sum('due_amount');

        // 2. Cash in Hand (This is always current total, not range-based usually, but we can show it)
        $cashInHand = CashTransaction::getCurrentBalance();

        // 3. Best Selling Products
        $bestSelling = SaleItem::select('medicine_id', DB::raw('SUM(qty_tablets) as total_qty'), DB::raw('SUM(subtotal) as total_revenue'))
            ->whereHas('sale', function($q) use ($start, $end) {
                $q->whereBetween('sale_date', [$start, $end]);
            })
            ->groupBy('medicine_id')
            ->orderByDesc('total_qty')
            ->with('medicine:id,medicine_name')
            ->take(5)
            ->get();

        // 4. Payments by Method
        $payments = Sale::select('payment_method', DB::raw('SUM(grand_total) as total'))
            ->whereBetween('sale_date', [$start, $end])
            ->groupBy('payment_method')
            ->get();

        // 5. Low Stock (Stock below reorder level)
        $lowStockCount = Medicine::where('stock', '<=', DB::raw('reorder_level'))->count();
        $lowStockItems = Medicine::where('stock', '<=', DB::raw('reorder_level'))
            ->select('id', 'medicine_name', 'stock', 'reorder_level')
            ->take(5)
            ->get();

        // 6. Expiring Soon (Within 90 days)
        $expiringSoonCount = StockBatch::where('qty_tablets_remaining', '>', 0)
            ->whereBetween('expiry_date', [Carbon::now(), Carbon::now()->addDays(90)])
            ->count();
        
        $expiringItems = StockBatch::where('qty_tablets_remaining', '>', 0)
            ->whereBetween('expiry_date', [Carbon::now(), Carbon::now()->addDays(90)])
            ->with('medicine:id,medicine_name')
            ->orderBy('expiry_date')
            ->take(5)
            ->get();

        // 7. Monthly Revenue (Current Year)
        $monthlyRevenue = Sale::select(
                DB::raw('MONTH(sale_date) as month'),
                DB::raw('SUM(grand_total) as revenue')
            )
            ->whereYear('sale_date', $now->year)
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        // 8. Stock Value & Purchase Cost
        // Stock Value is current total value of inventory
        $stockValue = (float) Medicine::select(DB::raw('SUM(stock * cost_price) as total_value'))->value('total_value');

        // Purchase Cost in range
        $purchaseCost = (float) GRN::whereBetween('received_date', [$start, $end])->sum('total_amount');

        // 9. Estimated Profit
        // Profit = Sales - COGS
        // COGS = Sum(sale_items.qty * batch.cost_per_unit)
        $cogs = (float) SaleItem::whereHas('sale', function($q) use ($start, $end) {
                $q->whereBetween('sale_date', [$start, $end]);
            })
            ->join('stock_batches', 'sale_items.stock_batch_id', '=', 'stock_batches.id')
            ->select(DB::raw('SUM(sale_items.qty_tablets * stock_batches.cost_per_unit) as total_cogs'))
            ->value('total_cogs');

        $estimatedProfit = $totalSales - $cogs;

        return response()->json([
            'success' => true,
            'data' => [
                'metrics' => [
                    'total_sales' => $totalSales,
                    'total_transactions' => $totalTransactions,
                    'remaining_due' => $remainingDue,
                    'cash_in_hand' => $cashInHand,
                    'stock_value' => $stockValue,
                    'purchase_cost' => $purchaseCost,
                    'estimated_profit' => $estimatedProfit,
                    'low_stock_count' => $lowStockCount,
                    'expiring_soon_count' => $expiringSoonCount,
                ],
                'best_selling' => $bestSelling,
                'payments' => $payments,
                'low_stock_items' => $lowStockItems,
                'expiring_items' => $expiringItems,
                'monthly_revenue' => $monthlyRevenue,
            ]
        ]);
    }
}
