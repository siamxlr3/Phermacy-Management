<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\AlertService;
use App\Http\Resources\Api\AlertResource;
use Illuminate\Http\JsonResponse;

class AlertController extends Controller
{
    protected $alertService;

    public function __construct(AlertService $alertService)
    {
        $this->alertService = $alertService;
    }

    public function index(Request $request)
    {
        $perPage  = $request->get('per_page', 10);
        $type     = $request->get('type');
        $severity = $request->get('severity');
        $fromDate = $request->get('from_date');
        $toDate   = $request->get('to_date');
        $search   = $request->get('search');

        $alerts = $this->alertService->getActiveAlerts($perPage, $type, $severity, $fromDate, $toDate, $search);
        return AlertResource::collection($alerts);
    }

    public function summary()
    {
        return response()->json([
            'count' => $this->alertService->getAlertCount()
        ]);
    }

    public function dismiss(int $id): JsonResponse
    {
        $success = $this->alertService->dismissAlert($id);
        
        return response()->json([
            'success' => $success,
            'message' => $success ? 'Alert dismissed' : 'Failed to dismiss alert'
        ]);
    }

    public function runProcess(): JsonResponse
    {
        $expiries = $this->alertService->triggerExpiryScan();
        $stock = $this->alertService->bulkStockCheck();

        return response()->json([
            'success' => true,
            'message' => 'Inventory scan completed',
            'data' => [
                'expiry_alerts' => $expiries,
                'stock_alerts' => $stock
            ]
        ]);
    }
}
