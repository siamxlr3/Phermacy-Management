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
    }

    /**
     * Get items expiring soon (e.g. within 90 days)
     */
    public function getNearExpiryStock(int $days = 90)
    {
        return StockBatch::where('qty_tablets_remaining', '>', 0)
            ->whereBetween('expiry_date', [
                Carbon::tomorrow()->toDateString(), 
                Carbon::today()->addDays($days)->toDateString()
            ])
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
     * Includes BOTH Pending Purchase Orders and Received Goods (GRNs) with balances.
     */
    public function getSupplierPaymentDue()
    {
        $poDues = PurchaseOrder::where('status', '!=', 'Cancelled')
            ->where('payment_status', '!=', 'Paid')
            ->whereRaw('total_amount > paid_amount')
            ->selectRaw('SUM(total_amount - paid_amount) as total_po_due')
            ->first();

        return (float)($poDues->total_po_due ?? 0);
    }

    /**
     * Get list of individual unpaid supplier bills
     */
    public function getUnpaidSupplierBills()
    {
        return PurchaseOrder::with('supplier')
            ->where('status', '!=', 'Cancelled')
            ->where('payment_status', '!=', 'Paid')
            ->whereRaw('total_amount > paid_amount')
            ->selectRaw('*, (total_amount - paid_amount) as balance_due')
            ->orderByDesc('balance_due')
            ->get();
    }

    /**
     * Count already expired items
     */
    public function getExpiredStockCount()
    {
        return StockBatch::where('qty_tablets_remaining', '>', 0)
            ->where('expiry_date', '<=', Carbon::today()->toDateString())
            ->count();
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
