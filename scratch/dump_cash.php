<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(
    Illuminate\Http\Request::capture()
);

use App\Models\CashTransaction;

$ct = CashTransaction::first();
if ($ct) {
    print_r($ct->toArray());
} else {
    echo "No cash transactions.\n";
}
