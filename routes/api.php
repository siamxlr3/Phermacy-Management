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
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ManufacturerController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\PurchaseOrderController;
use App\Http\Controllers\Api\TaxController;
use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\GRNController;
use App\Http\Controllers\Api\StockController;
use App\Http\Controllers\Api\AdjustmentController;
use App\Http\Controllers\Api\SaleController;
use App\Http\Controllers\Api\ReturnController;
use App\Http\Controllers\Api\AlertController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\InventoryReportController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\LeaveTypeController;
use App\Http\Controllers\Api\LeaveController;
use App\Http\Controllers\Api\PayrollController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\ShiftController;
use App\Http\Controllers\Api\StaffController;

Route::get('categories/active', [CategoryController::class, 'active']);
Route::apiResource('categories', CategoryController::class);

Route::get('manufacturers/active', [ManufacturerController::class, 'active']);
Route::apiResource('manufacturers', ManufacturerController::class);

Route::get('suppliers/active', [SupplierController::class, 'active']);
Route::apiResource('suppliers', SupplierController::class);

Route::patch('purchase-orders/{purchase_order}/status', [PurchaseOrderController::class, 'updateStatus']);
Route::apiResource('purchase-orders', PurchaseOrderController::class);

Route::get('medicines/active', [MedicineController::class, 'active']);
Route::apiResource('medicines', MedicineController::class);

// GRN and Stocks
Route::apiResource('grns', GRNController::class);
Route::get('stocks/overview', [StockController::class, 'overview']);
Route::get('stocks/batches', [StockController::class, 'batches']);
Route::get('medicines/{medicine}/batches', [StockController::class, 'batchesByMedicine']);

// Adjustments
Route::apiResource('adjustments', AdjustmentController::class);

// Sales / POS
Route::get('sales/lookup/{invoiceNumber}', [SaleController::class, 'lookup']); // Optional, but I added it to ReturnController instead
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
Route::get('reports/inventory', [InventoryReportController::class, 'dashboard']);
Route::post('reports/refresh', [ReportController::class, 'refresh']);
Route::post('reports/inventory/refresh', [InventoryReportController::class, 'refresh']);

Route::get('taxes/active', [TaxController::class, 'active']);
Route::apiResource('taxes', TaxController::class);

Route::get('addresses/active', [AddressController::class, 'active']);
Route::apiResource('addresses', AddressController::class);

Route::get('expenses/summary', [ExpenseController::class, 'summary']);
Route::apiResource('expenses', ExpenseController::class);

// HRM Module
Route::get('hrm/roles/active', [RoleController::class, 'active']);
Route::apiResource('hrm/roles', RoleController::class);

Route::get('hrm/shifts/active', [ShiftController::class, 'active']);
Route::apiResource('hrm/shifts', ShiftController::class);

Route::get('hrm/staff/active', [StaffController::class, 'active']);
Route::apiResource('hrm/staff', StaffController::class);

Route::apiResource('hrm/attendance', AttendanceController::class);

Route::get('hrm/leave-types/active', [LeaveTypeController::class, 'active']);
Route::apiResource('hrm/leave-types', LeaveTypeController::class);

Route::apiResource('hrm/leaves', LeaveController::class);
Route::apiResource('hrm/payrolls', PayrollController::class);
