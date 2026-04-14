<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreStaffRequest;
use App\Http\Requests\Api\UpdateStaffRequest;
use App\Http\Resources\Api\StaffResource;
use App\Services\StaffService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StaffController extends Controller
{
    protected $staffService;

    public function __construct(StaffService $staffService)
    {
        $this->staffService = $staffService;
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search');
        $status = $request->get('status');
        $fromDate = $request->get('from_date');
        $toDate = $request->get('to_date');
        
        $staff = $this->staffService->getAllStaff($perPage, $search, $status, $fromDate, $toDate);
        return StaffResource::collection($staff);
    }

    public function active(): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $staff = $this->staffService->getActiveStaff();
        return StaffResource::collection($staff);
    }

    public function store(StoreStaffRequest $request): JsonResponse
    {
        try {
            $staff = $this->staffService->createStaff($request->validated());
            return response()->json([
                'success' => true,
                'message' => 'Staff member recorded successfully',
                'data' => new StaffResource($staff)
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    public function show($id): StaffResource
    {
        $staff = $this->staffService->getStaffById($id);
        return new StaffResource($staff);
    }

    public function update(UpdateStaffRequest $request, $id): JsonResponse
    {
        try {
            $staff = $this->staffService->updateStaff($id, $request->validated());
            return response()->json([
                'success' => true,
                'message' => 'Staff records updated successfully',
                'data' => new StaffResource($staff)
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
            $this->staffService->deleteStaff($id);
            return response()->json([
                'success' => true,
                'message' => 'Staff member removed successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }
}
