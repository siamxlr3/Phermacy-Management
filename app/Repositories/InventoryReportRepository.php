<?php

namespace App\Repositories;

use App\Models\StockBatch;
use App\Models\PurchaseOrder;
use App\Models\GRN;
use App\Models\Medicine;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class InventoryReportRepository
{
    /**
     * Get Stock Valuation (Total Capital tied in stock)
     */
    public function getStockValuation()
    {
        return StockBatch::where('qty_tablets_remaining', '>', 0)
            ->join('medicines', 'stock_batches.medicine_id', '=', 'medicines.id')
            ->leftJoin('categories', 'medicines.category_id', '=', 'categories.id')
            ->selectRaw('
                IFNULL(categories.name, "Uncategorized") as category_name,
                SUM(stock_batches.qty_tablets_remaining * stock_batches.cost_per_tablet) as total_value,
                COUNT(DISTINCT medicines.id) as unique_medicines,
                SUM(stock_batches.qty_tablets_remaining) as total_tablets
            ')
            ->groupBy('category_name')
            ->orderByDesc('total_value')
            ->get();
    }

    /**
     * Get items expiring soon (e.g. within 90 days)
     */
    public function getNearExpiryStock(int $days = 90)
    {
        return StockBatch::where('qty_tablets_remaining', '>', 0)
            ->whereBetween('expiry_date', [now()->toDateString(), now()->addDays($days)->toDateString()])
            ->with(['medicine', 'supplier'])
            ->orderBy('expiry_date')
            ->get();
    }

    /**
     * Get specific expiry risks within a custom date range (for filtering)
     */
    public function getExpiryRiskInRange(string $fromDate, string $toDate)
    {
        return StockBatch::where('qty_tablets_remaining', '>', 0)
            ->whereBetween('expiry_date', [$fromDate, $toDate])
            ->with(['medicine', 'supplier'])
            ->orderBy('expiry_date')
            ->get();
    }

    /**
     * Get slow moving items (zero sales in N days)
     */
    public function getSlowMovingStock(int $days = 90)
    {
        // Medicines with stock but no sale items in the last $days
        $soldRecently = DB::table('sale_items')
            ->where('created_at', '>=', now()->subDays($days))
            ->pluck('medicine_id')
            ->unique();

        return Medicine::where('medicines.stock', '>', 0)
            ->whereNotIn('medicines.id', $soldRecently)
            ->leftJoin('sale_items', 'medicines.id', '=', 'sale_items.medicine_id')
            ->select('medicines.id', 'medicines.name', 'medicines.stock', 'medicines.reorder_level')
            ->selectRaw('MAX(sale_items.created_at) as last_sold_at')
            ->groupBy('medicines.id', 'medicines.name', 'medicines.stock', 'medicines.reorder_level')
            ->orderByDesc('medicines.stock')
            ->get();
    }

    /**
     * Get Purchase History by Supplier
     */
    public function getSupplierPurchases(string $fromDate, string $toDate)
    {
        return PurchaseOrder::whereBetween('order_date', [$fromDate, $toDate])
            ->where('status', '!=', 'Cancelled')
            ->with(['supplier'])
            ->selectRaw('
                supplier_id,
                COUNT(*) as order_count,
                SUM(total_amount) as total_spent,
                SUM(CASE WHEN status = "Received" THEN total_amount ELSE 0 END) as received_amount
            ')
            ->groupBy('supplier_id')
            ->get();
    }

    /**
     * Get GRN Summary
     */
    public function getGRNSummary(string $fromDate, string $toDate)
    {
        return GRN::whereBetween('received_date', [$fromDate, $toDate])
            ->with('purchaseOrder.supplier')
            ->latest()
            ->get();
    }

    /**
     * Get Supplier Payment Due (Outstanding Liabilities)
     * Includes ONLY Pending (Planned) orders. 
     * Once an order is Received, its value is moved to the "Stock Price Total" asset card.
     */
    public function getSupplierPaymentDue()
    {
        return PurchaseOrder::where('status', 'Pending')
            ->where('payment_status', 'Pending')
            ->with(['supplier'])
            ->selectRaw('*, (total_amount - paid_amount) as balance_due')
            ->orderByDesc('balance_due')
            ->get();
    }

    /**
     * Get count of medicines at or below reorder level
     */
    public function getLowStockCount()
    {
        return Medicine::where('status', 'Active')
            ->where(function($query) {
                $query->whereColumn('stock', '<=', 'reorder_level');
            })
            ->count();
    }
}
