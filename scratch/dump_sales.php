<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(
    Illuminate\Http\Request::capture()
);

use App\Models\Sale;

$sales = Sale::all();
foreach ($sales as $sale) {
    echo "ID: {$sale->id}, Date: {$sale->sale_date}, Invoice: {$sale->invoice_number}, Status: {$sale->status}, Grand Total: {$sale->grand_total}, Refunded Subtotal: {$sale->refunded_subtotal}, Net: " . ($sale->grand_total - $sale->refunded_subtotal) . "\n";
}
