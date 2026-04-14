<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\LeaveTypeRequest;
use App\Http\Resources\Api\LeaveTypeResource;
use App\Services\LeaveTypeService;
use Illuminate\Http\Request;
use Exception;

class LeaveTypeController extends Controller
{
    protected $leaveTypeService;

    public function __construct(LeaveTypeService $leaveTypeService)
    {
        $this->leaveTypeService = $leaveTypeService;
    }

    public function index(Request $request)
    {
        try {
            $perPage = $request->get('per_page', 10);
            $search = $request->get('search');
            $status = $request->get('status');

            $leaveTypes = $this->leaveTypeService->getAllLeaveTypes($perPage, $search, $status);
            return LeaveTypeResource::collection($leaveTypes);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch leave types: ' . $e->getMessage()
            ], 500);
        }
    }

    public function active()
    {
        try {
            $leaveTypes = $this->leaveTypeService->getActiveLeaveTypes();
            return LeaveTypeResource::collection($leaveTypes);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch active leave types.'
            ], 500);
        }
    }

    public function store(LeaveTypeRequest $request)
    {
        try {
            $leaveType = $this->leaveTypeService->createLeaveType($request->validated());
            return new LeaveTypeResource($leaveType);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create leave type: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $leaveType = $this->leaveTypeService->getLeaveTypeById($id);
            return new LeaveTypeResource($leaveType);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Leave type not found.'
            ], 404);
        }
    }

    public function update(LeaveTypeRequest $request, $id)
    {
        try {
            $leaveType = $this->leaveTypeService->updateLeaveType($id, $request->validated());
            return new LeaveTypeResource($leaveType);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update leave type: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $this->leaveTypeService->deleteLeaveType($id);
            return response()->json([
                'success' => true,
                'message' => 'Leave type deleted successfully'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete leave type: ' . $e->getMessage()
            ], 500);
        }
    }
}
