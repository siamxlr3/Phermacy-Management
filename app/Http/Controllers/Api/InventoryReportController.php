<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\InventoryReportService;
use Illuminate\Http\JsonResponse;

class InventoryReportController extends Controller
{
    protected $reportService;

    public function __construct(InventoryReportService $reportService)
    {
        $this->reportService = $reportService;
    }

    /**
     * Get inventory and purchase analytical dashboard
     */
    public function dashboard(Request $request): JsonResponse
    {
        $filters = $request->only(['from_date', 'to_date']);
        
        $data = $this->reportService->getInventoryAnalytics($filters);

        return response()->json([
            'success' => true,
            'message' => 'Inventory report generated successfully',
            'data' => $data
        ]);
    }

    /**
     * Clear analytical cache
     */
    public function refresh(): JsonResponse
    {
        $this->reportService->clearCache();

        return response()->json([
            'success' => true,
            'message' => 'Inventory analytics refreshed'
        ]);
    }
}
