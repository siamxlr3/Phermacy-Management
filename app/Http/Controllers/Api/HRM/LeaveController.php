<?php

namespace App\Http\Controllers\Api\HRM;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\HRM\LeaveRequest;
use App\Http\Resources\Api\HRM\LeaveResource;
use App\Services\LeaveService;
use Illuminate\Http\Request;
use Exception;

class LeaveController extends Controller
{
    protected $leaveService;

    public function __construct(LeaveService $leaveService)
    {
        $this->leaveService = $leaveService;
    }

    public function index(Request $request)
    {
        try {
            $perPage = $request->get('per_page', 10);
            $search = $request->get('search');
            $status = $request->get('status');
            $fromDate = $request->get('from_date');
            $toDate = $request->get('to_date');

            $leaves = $this->leaveService.getAllLeaves($perPage, $search, $status, $fromDate, $toDate);
            return LeaveResource::collection($leaves);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch leave records: ' . $e->getMessage()
            ], 500);
        }
    }

    public function store(LeaveRequest $request)
    {
        try {
            $leave = $this->leaveService.createLeave($request->validated());
            return new LeaveResource($leave);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit leave application: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $leave = $this->leaveService.getLeaveById($id);
            return new LeaveResource($leave);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Leave record not found.'
            ], 404);
        }
    }

    public function update(LeaveRequest $request, $id)
    {
        try {
            $leave = $this->leaveService.updateLeave($id, $request->validated());
            return new LeaveResource($leave);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update leave record: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $this->leaveService.deleteLeave($id);
            return response()->json([
                'success' => true,
                'message' => 'Leave record deleted successfully'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete record: ' . $e->getMessage()
            ], 500);
        }
    }
}
