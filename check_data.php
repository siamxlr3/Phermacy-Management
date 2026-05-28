<?php

use App\Models\StockBatch;
use App\Models\SaleItem;
use App\Models\Sale;
use Illuminate\Support\Facades\DB;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Checking StockBatch Valuation Data...\n";
$nullValuationCount = DB::table('stock_batches')->whereNull('total_cost_value')->orWhere('total_cost_value', 0)->count();
$totalBatches = DB::table('stock_batches')->count();
echo "Batches with 0 or NULL total_cost_value: $nullValuationCount / $totalBatches\n";

echo "\nChecking SaleItem Cost Price Data...\n";
$nullCostPriceCount = DB::table('sale_items')->whereNull('cost_price')->orWhere('cost_price', 0)->count();
$totalSaleItems = DB::table('sale_items')->count();
echo "SaleItems with 0 or NULL cost_price: $nullCostPriceCount / $totalSaleItems\n";

echo "\nChecking Sale Summary calculation...\n";
$start = now()->subDays(30)->startOfDay();
$end = now()->endOfDay();
$summary = Sale::getDashboardSummary($start, $end);
echo "Total Revenue: " . ($summary->total_revenue ?? 0) . "\n";
echo "Total COGS: " . ($summary->total_cogs ?? 0) . "\n";
$totalExpenses = (float) \App\Models\Expense::whereBetween('expense_date', [$start, $end])->sum('grand_total');
echo "Total Expenses: $totalExpenses\n";
echo "Estimated Profit: " . (($summary->total_revenue ?? 0) - ($summary->total_cogs ?? 0) - $totalExpenses) . "\n";

echo "\nChecking Inventory Valuation...\n";
$inventoryValuation = StockBatch::available()->sum('total_cost_value');
echo "Inventory Valuation Sum: $inventoryValuation\n";
