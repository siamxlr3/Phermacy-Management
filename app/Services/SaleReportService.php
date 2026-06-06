<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\SalesSummary;
use App\Models\SaleItem;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SaleReportService
{
    /**
     * Recalculate and save the summary for a specific date.
     */
    public function aggregateDate(string|Carbon $date): SalesSummary
    {
        $date = Carbon::parse($date)->format('Y-m-d');

        $stats = Sale::whereDate('sale_date', $date)
            ->selectRaw("
                SUM(grand_total) as total_gross,
                SUM(CASE WHEN status IN ('Completed', 'Due', 'Partially Returned', 'Returned') THEN (grand_total - COALESCE(refunded_subtotal, 0)) ELSE 0 END) as total_revenue,
                SUM(CASE WHEN status IN ('Completed', 'Partially Returned', 'Returned') THEN (grand_total - COALESCE(refunded_subtotal, 0)) ELSE 0 END) as total_completed,
                SUM(tax_total) as total_tax,
                SUM(discount_total) as total_discount,
                SUM(COALESCE(refunded_subtotal, 0)) as total_returned,
                SUM(due_amount) as total_due,
                COUNT(*) as transaction_count,
                COUNT(CASE WHEN status IN ('Returned', 'Partially Returned') THEN 1 END) as returns_count,
                COUNT(DISTINCT CASE WHEN due_amount > 0 THEN customer_phone END) as due_customers_count
            ")
            ->first();

        $cogs = SaleItem::join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->whereDate('sales.sale_date', $date)
            ->where('sales.status', '!=', Sale::STATUS_CANCELLED)
            ->sum(DB::raw('COALESCE(sale_items.cost_price, 0) * sale_items.qty_tablets'));

        return SalesSummary::updateOrCreate(
            ['date' => $date],
            [
                'total_gross'         => $stats->total_gross ?? 0,
                'total_revenue'       => $stats->total_revenue ?? 0,
                'total_completed'     => $stats->total_completed ?? 0,
                'total_tax'           => $stats->total_tax ?? 0,
                'total_discount'      => $stats->total_discount ?? 0,
                'total_cogs'          => $cogs,
                'total_returned'      => $stats->total_returned ?? 0,
                'total_due'           => $stats->total_due ?? 0,
                'transaction_count'   => $stats->transaction_count ?? 0,
                'returns_count'       => $stats->returns_count ?? 0,
                'due_customers_count' => $stats->due_customers_count ?? 0,
            ]
        );
    }

    /**
     * Get consolidated summary for a date range.
     */
    public function getSummary(Carbon $start, Carbon $end): array
    {
        $startDate = $start->copy()->startOfDay();
        $endDate = $end->copy()->endOfDay();

        // 1. Ensure all dates in range are aggregated
        $current = $startDate->copy();
        while ($current <= $endDate) {
            $dateString = $current->format('Y-m-d');
            // Optimization: Only aggregate if not exists OR if it is TODAY (to get live updates)
            if (!SalesSummary::where('date', $dateString)->exists() || $current->isToday()) {
                $this->aggregateDate($current);
            }
            $current->addDay();
        }

        // 2. Fetch from aggregate table
        $summary = SalesSummary::whereBetween('date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->selectRaw("
                SUM(total_gross) as total_gross,
                SUM(total_revenue) as total_revenue,
                SUM(total_completed) as total_completed,
                SUM(total_returned) as total_returned,
                SUM(total_due) as total_due,
                SUM(due_customers_count) as total_due_customers,
                SUM(total_tax) as total_tax,
                SUM(total_discount) as total_discount,
                SUM(total_cogs) as total_cogs,
                SUM(transaction_count) as total_transactions,
                SUM(returns_count) as returns_count
            ")
            ->first();

        return [
            'total_gross'         => (float) ($summary->total_gross ?? 0),
            'total_revenue'       => (float) ($summary->total_revenue ?? 0),
            'total_completed'     => (float) ($summary->total_completed ?? 0),
            'total_returned'      => (float) ($summary->total_returned ?? 0),
            'total_due'           => (float) ($summary->total_due ?? 0),
            'total_due_customers' => (int)   ($summary->total_due_customers ?? 0),
            'total_tax'           => (float) ($summary->total_tax ?? 0),
            'total_discount'      => (float) ($summary->total_discount ?? 0),
            'total_cogs'          => (float) ($summary->total_cogs ?? 0),
            'total_transactions'  => (int)   ($summary->total_transactions ?? 0),
            'returns_count'       => (int)   ($summary->returns_count ?? 0),
        ];
    }
}
