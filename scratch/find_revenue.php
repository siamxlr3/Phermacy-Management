<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(
    Illuminate\Http\Request::capture()
);

use App\Models\Sale;

$res = Sale::selectRaw("
    SUM(subtotal) as subtotal,
    SUM(grand_total) as grand_total,
    SUM(tax_total) as tax,
    SUM(discount_total) as discount
")->first();

print_r($res->toArray());
