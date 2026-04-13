<?php

namespace App\Repositories;

use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportRepository
{
    /**
     * Get high-level summary KPIs
     */
    public function getSummary(string $fromDate, string $toDate)
    {
        return Sale::where('status', 'Completed')
            ->whereBetween('sale_date', [$fromDate, $toDate])
            ->selectRaw('
                COUNT(*) as total_orders,
                SUM(subtotal) as total_revenue,
                SUM(tax_total) as total_tax,
                SUM(discount_total) as total_discount,
                SUM(grand_total) as total_receivable
            ')
            ->first();
    }

    /**
     * Get Daily Sales breakdown
     */
    public function getDailySales(string $fromDate, string $toDate)
    {
        return Sale::where('status', 'Completed')
            ->whereBetween('sale_date', [$fromDate, $toDate])
            ->selectRaw('DATE(sale_date) as date, SUM(grand_total) as total, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get();
    }

    /**
     * Get Top Selling Medicines
     */
    public function getTopMedicines(string $fromDate, string $toDate, int $limit = 10)
    {
        return SaleItem::whereHas('sale', function($q) use ($fromDate, $toDate) {
                $q->where('status', 'Completed')
                  ->whereBetween('sale_date', [$fromDate, $toDate]);
            })
            ->join('medicines', 'sale_items.medicine_id', '=', 'medicines.id')
            ->selectRaw('
                medicines.id,
                medicines.name,
                SUM(sale_items.qty_tablets) as total_qty,
                SUM(sale_items.subtotal) as total_revenue
            ')
            ->groupBy('medicines.id', 'medicines.name')
            ->orderByDesc('total_qty')
            ->limit($limit)
            ->get();
    }

    /**
     * Get Revenue by Medicine Category
     */
    public function getCategoryRevenue(string $fromDate, string $toDate)
    {
        return SaleItem::whereHas('sale', function($q) use ($fromDate, $toDate) {
                $q->where('status', 'Completed')
                  ->whereBetween('sale_date', [$fromDate, $toDate]);
            })
            ->join('medicines', 'sale_items.medicine_id', '=', 'medicines.id')
            ->leftJoin('categories', 'medicines.category_id', '=', 'categories.id')
            ->selectRaw('
                IFNULL(categories.name, "Uncategorized") as category_name,
                SUM(sale_items.subtotal) as total_revenue,
                COUNT(sale_items.id) as total_items
            ')
            ->groupBy('category_name')
            ->orderByDesc('total_revenue')
            ->get();
    }

    /**
     * Get Sales by Payment Method
     */
    public function getPaymentMethodBreakdown(string $fromDate, string $toDate)
    {
        return Sale::where('status', 'Completed')
            ->whereBetween('sale_date', [$fromDate, $toDate])
            ->selectRaw('payment_method, SUM(grand_total) as total, COUNT(*) as count')
            ->groupBy('payment_method')
            ->get();
    }

    /**
     * Get Sales by Cashier (User)
     */
    public function getCashierSales(string $fromDate, string $toDate)
    {
        return Sale::where('status', 'Completed')
            ->whereBetween('sale_date', [$fromDate, $toDate])
            ->join('users', 'sales.user_id', '=', 'users.id')
            ->selectRaw('users.name as cashier_name, SUM(grand_total) as total, COUNT(*) as count')
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('total')
            ->get();
    }
}
