<?php

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ReportController;
use Illuminate\Http\Request;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$controller = new ReportController();
$request = Request::create('/api/v1/reports/dashboard', 'GET', [
    'from_date' => now()->subDays(30)->toDateString(),
    'to_date' => now()->toDateString()
]);

$response = $controller->dashboard($request);
echo $response->getContent();
