<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(
    Illuminate\Http\Request::capture()
);

use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ReportController;
use Illuminate\Http\Request;

// Force clear cache so we query database directly
Illuminate\Support\Facades\Cache::tags(['sales', 'reports', 'dashboard', 'inventory'])->flush();

$fromDate = \Carbon\Carbon::now()->subDays(29)->toDateString();
$toDate = \Carbon\Carbon::now()->toDateString();

$request = new Request([
    'from_date' => $fromDate,
    'to_date' => $toDate
]);
$dashboardCtrl = new DashboardController();
$reportCtrl = new ReportController();

$dashboardResp = $dashboardCtrl->index($request);
$reportResp = $reportCtrl->dashboard($request);

$dashboardData = json_decode($dashboardResp->getContent(), true)['data'];
$reportData = json_decode($reportResp->getContent(), true)['data'];

echo "--- DASHBOARD CONTROLLER METRICS (Last 30 Days) ---\n";
print_r($dashboardData['metrics']);

echo "\n--- REPORT CONTROLLER SUMMARY (Last 30 Days) ---\n";
print_r($reportData['summary']);

// Compare
$dashRev = $dashboardData['metrics']['total_revenue'];
$repRev = $reportData['summary']['total_revenue'];
echo "\nTotal Revenue comparison: Dashboard = $dashRev, Report = $repRev\n";

$dashTrend = array_sum(array_column($dashboardData['monthly_trend'], 'revenue'));
$repTrend = array_sum(array_column($reportData['monthly_revenue'], 'revenue'));
echo "YTD Monthly Revenue sum: Dashboard = $dashTrend, Report = $repTrend\n";
