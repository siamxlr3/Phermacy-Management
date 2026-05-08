<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
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
            return [
                'summary' => Sale::where('status', 'Completed')
                    ->whereBetween('sale_date', [$start, $end])
                    ->selectRaw('
                        COUNT(*) as total_transactions,
                        SUM(subtotal) as total_revenue,
                        SUM(tax_total) as total_tax,
                        SUM(discount_total) as total_discount,
                        SUM(grand_total) as total_receivable
                    ')
                    ->first(),

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

                'cashiers' => Sale::where('status', 'Completed')
                    ->whereBetween('sale_date', [$start, $end])
                    ->join('users', 'sales.user_id', '=', 'users.id')
                    ->selectRaw('users.name as cashier_name, SUM(grand_total) as total, COUNT(*) as count')
                    ->groupBy('users.id', 'users.name')
                    ->orderByDesc('total')
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
