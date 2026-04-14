<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ShiftRequest;
use App\Http\Resources\Api\ShiftResource;
use App\Services\ShiftService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ShiftController extends Controller
{
    protected $shiftService;

    public function __construct(ShiftService $shiftService)
    {
        $this->shiftService = $shiftService;
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search');
        
        $shifts = $this->shiftService->getAllShifts($perPage, $search);
        return ShiftResource::collection($shifts);
    }

    public function active()
    {
        $shifts = $this->shiftService->getActiveShifts();
        return ShiftResource::collection($shifts);
    }

    public function store(ShiftRequest $request): JsonResponse
    {
        try {
            $shift = $this->shiftService->createShift($request->validated());
            return response()->json([
                'success' => true,
                'message' => 'Shift created successfully',
                'data' => new ShiftResource($shift)
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    public function update(ShiftRequest $request, $id): JsonResponse
    {
        try {
            $shift = $this->shiftService->updateShift($id, $request->validated());
            return response()->json([
                'success' => true,
                'message' => 'Shift updated successfully',
                'data' => new ShiftResource($shift)
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
            $this->shiftService->deleteShift($id);
            return response()->json([
                'success' => true,
                'message' => 'Shift deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }
}
