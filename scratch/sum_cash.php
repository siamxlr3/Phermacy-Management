<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(
    Illuminate\Http\Request::capture()
);

use App\Models\CashTransaction;
use Illuminate\Support\Facades\DB;

$types = CashTransaction::select('transaction_type', DB::raw('SUM(amount) as total'))->groupBy('transaction_type')->get();
foreach ($types as $t) {
    echo "Type: {$t->transaction_type}, Total: {$t->total}\n";
}
