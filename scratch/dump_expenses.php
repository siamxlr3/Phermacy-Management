<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(
    Illuminate\Http\Request::capture()
);

use App\Models\Expense;

echo "--- EXPENSES ---\n";
foreach (Expense::all() as $exp) {
    echo "ID: {$exp->id}, Date: {$exp->expense_date}, Grand Total: {$exp->grand_total}, Status: {$exp->status}\n";
}
