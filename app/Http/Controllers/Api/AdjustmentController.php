<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\AdjustmentService;
use App\Http\Requests\Api\StoreAdjustmentRequest;
use App\Http\Requests\Api\UpdateAdjustmentRequest;
use App\Http\Resources\Api\AdjustmentResource;
use App\Models\StockAdjustment;
use Illuminate\Http\JsonResponse;

class AdjustmentController extends Controller
{
    protected $adjustmentService;

    public function __construct(AdjustmentService $adjustmentService)
    {
        $this->adjustmentService = $adjustmentService;
    }

    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search');
        $status = $request->get('status');
        $fromDate = $request->get('from_date');
        $toDate = $request->get('to_date');

        $adjustments = $this->adjustmentService->getAllAdjustments($perPage, $search, $status, $fromDate, $toDate);
        return AdjustmentResource::collection($adjustments);
    }

    public function store(StoreAdjustmentRequest $request): JsonResponse
    {
        try {
            $adjustment = $this->adjustmentService->createAdjustment($request->validated());
            return response()->json([
                'success' => true,
                'message' => 'Stock adjustment recorded successfully',
                'data' => new AdjustmentResource($adjustment)
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    public function show($id)
    {
        $adjustment = StockAdjustment::with(['medicine', 'batch', 'user'])->findOrFail($id);
        return new AdjustmentResource($adjustment);
    }

    public function update(UpdateAdjustmentRequest $request, $id): JsonResponse
    {
        try {
            $adjustment = StockAdjustment::findOrFail($id);
            $updated = $this->adjustmentService->updateAdjustment($adjustment, $request->validated());
            
            return response()->json([
                'success' => true,
                'message' => 'Stock adjustment updated successfully',
                'data' => new AdjustmentResource($updated)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            $adjustment = StockAdjustment::findOrFail($id);
            $this->adjustmentService->deleteAdjustment($adjustment);

            return response()->json([
                'success' => true,
                'message' => 'Stock adjustment deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }
}
