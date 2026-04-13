<?php

use App\Models\PurchaseOrder;
use App\Models\Sale;

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Starting Math Integrity Fix...\n";

// Fix Purchase Orders
$pos = PurchaseOrder::all();
foreach ($pos as $po) {
    $oldTotal = $po->total_amount;
    $po->syncTotal();
    $newTotal = $po->total_amount;
    
    if (round($oldTotal, 2) != round($newTotal, 2)) {
        echo "FIXED PO #{$po->id}: {$oldTotal} -> {$newTotal}\n";
    }
}

// Fix Sales
$sales = Sale::all();
foreach ($sales as $sale) {
    $oldTotal = $sale->grand_total;
    $sale->syncTotal();
    $newTotal = $sale->grand_total;
    
    if (round($oldTotal, 2) != round($newTotal, 2)) {
        echo "FIXED Sale #{$sale->id}: {$oldTotal} -> {$newTotal}\n";
    }
}

echo "Math Integrity Fix Complete!\n";
