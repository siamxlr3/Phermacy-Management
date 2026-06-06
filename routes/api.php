<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

use App\Http\Controllers\Api\MedicineController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\PurchaseOrderController;
use App\Http\Controllers\Api\TaxController;
use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\GRNController;
use App\Http\Controllers\Api\StockController;

use App\Http\Controllers\Api\SaleController;
use App\Http\Controllers\Api\ReturnController;
use App\Http\Controllers\Api\AlertController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\InventoryReportController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\CashRegisterController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\StockAdjustmentController;

Route::apiResource('suppliers', SupplierController::class);

Route::patch('purchase-orders/{purchase_order}/status', [PurchaseOrderController::class, 'updateStatus']);
Route::apiResource('purchase-orders', PurchaseOrderController::class);

Route::get('medicines/categories', [MedicineController::class, 'categories']);
Route::get('medicines/manufacturers', [MedicineController::class, 'manufacturers']);
Route::post('medicines/import', [MedicineController::class, 'import']);
Route::apiResource('medicines', MedicineController::class);

// GRN and Stocks
Route::apiResource('grns', GRNController::class);
Route::get('stocks/overview', [StockController::class, 'overview']);
Route::get('stocks/batches', [StockController::class, 'batches']);
Route::apiResource('stock-adjustments', StockAdjustmentController::class);


// Sales / POS
Route::get('cash-registers', [CashRegisterController::class, 'index']);
Route::get('cash-registers/status', [CashRegisterController::class, 'status']);
Route::post('cash-registers/open', [CashRegisterController::class, 'open']);
Route::post('cash-registers/close', [CashRegisterController::class, 'close']);
Route::patch('sales/{sale}/status', [SaleController::class, 'updateStatus']);
Route::apiResource('sales', SaleController::class)->only(['index', 'store', 'show']);

// Sale Returns
Route::get('returns/lookup/{invoiceNumber}', [ReturnController::class, 'lookup']);
Route::apiResource('returns', ReturnController::class)->only(['index', 'store', 'show']);

// Inventory Alerts
Route::get('alerts/summary', [AlertController::class, 'summary']);
Route::post('alerts/process', [AlertController::class, 'runProcess']);
Route::post('alerts/{id}/dismiss', [AlertController::class, 'dismiss']);
Route::apiResource('alerts', AlertController::class)->only(['index']);

// Reports
Route::get('reports/dashboard', [ReportController::class, 'dashboard']);
Route::get('reports/inventory', [InventoryReportController::class, 'index']);
Route::post('reports/refresh', [ReportController::class, 'refresh']);
Route::post('reports/inventory/refresh', [InventoryReportController::class, 'refresh']);

// Dashboard Stats
Route::get('dashboard/stats', [DashboardController::class, 'index']);

Route::apiResource('taxes', TaxController::class);

Route::apiResource('addresses', AddressController::class);

Route::get('expenses/summary', [ExpenseController::class, 'summary']);
Route::apiResource('expenses', ExpenseController::class);
