<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(
    Illuminate\Http\Request::capture()
);

use App\Models\PurchaseOrder;
use App\Models\GRN;

echo "--- PURCHASE ORDERS ---\n";
foreach (PurchaseOrder::all() as $po) {
    echo "ID: {$po->id}, Date: {$po->order_date}, Grand Total: {$po->total_amount}, Paid: {$po->paid_amount}\n";
}

echo "\n--- GRN ---\n";
foreach (GRN::all() as $grn) {
    echo "ID: {$grn->id}, Date: {$grn->received_date}, Total: {$grn->total_amount}\n";
}
