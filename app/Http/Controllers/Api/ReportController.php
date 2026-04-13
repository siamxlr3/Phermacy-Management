<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\ReportService;
use Illuminate\Http\JsonResponse;

class ReportController extends Controller
{
    protected $reportService;

    public function __construct(ReportService $reportService)
    {
        $this->reportService = $reportService;
    }

    /**
     * Get a consolidated analytics dashboard
     */
    public function dashboard(Request $request): JsonResponse
    {
        $filters = $request->only(['from_date', 'to_date']);
        
        $data = $this->reportService->getAnalyticsDashboard($filters);

        return response()->json([
            'success' => true,
            'message' => 'Report generated successfully',
            'data' => $data
        ]);
    }

    /**
     * Clear and refresh report data
     */
    public function refresh(): JsonResponse
    {
        $this->reportService->clearReportCache();

        return response()->json([
            'success' => true,
            'message' => 'Report cache cleared'
        ]);
    }
}
