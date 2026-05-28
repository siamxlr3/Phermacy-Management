<?php

use App\Models\StockBatch;
use App\Models\SaleItem;
use Illuminate\Support\Facades\DB;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Step 1: Populating StockBatch Valuation Data...\n";
$batches = StockBatch::all();
$updatedBatches = 0;
foreach ($batches as $batch) {
    // calculateValuation is called in the saving hook
    $batch->save(); 
    $updatedBatches++;
}
echo "Total StockBatches updated: $updatedBatches\n";

echo "\nStep 2: Populating SaleItem Cost Price Data...\n";
$items = SaleItem::whereNull('cost_price')->orWhere('cost_price', 0)->get();
$updatedItems = 0;
foreach ($items as $item) {
    if ($item->stock_batch_id) {
        $item->cost_price = $item->batch->cost_per_unit;
        $item->save();
        $updatedItems++;
    }
}
echo "Total SaleItems updated: $updatedItems\n";

echo "\nStep 3: Flushing Cache...\n";
\Illuminate\Support\Facades\Cache::tags(['reports', 'dashboard', 'stock'])->flush();
echo "Cache flushed.\n";

echo "\nData Repair Completed Successfully!\n";
