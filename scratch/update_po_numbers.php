<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\PurchaseOrder;
use Carbon\Carbon;

PurchaseOrder::whereNull('po_number')->get()->each(function($po) {
    $date = Carbon::parse($po->order_date)->format('Ymd');
    $prefix = "PO-{$date}-";
    $count = PurchaseOrder::where('po_number', 'like', "{$prefix}%")->count();
    $po->update(['po_number' => $prefix . str_pad($count + 1, 3, '0', STR_PAD_LEFT)]);
    echo "Updated PO #{$po->id} to {$po->po_number}\n";
});
