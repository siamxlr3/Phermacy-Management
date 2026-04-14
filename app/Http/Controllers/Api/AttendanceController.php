<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\AttendanceRequest;
use App\Http\Resources\Api\AttendanceResource;
use App\Services\AttendanceService;
use Illuminate\Http\Request;
use Exception;

class AttendanceController extends Controller
{
    protected $attendanceService;

    public function __construct(AttendanceService $attendanceService)
    {
        $this->attendanceService = $attendanceService;
    }

    public function index(Request $request): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        try {
            $perPage = $request->get('per_page', 10);
            $search = $request->get('search');
            $status = $request->get('status');
            $fromDate = $request->get('from_date');
            $toDate = $request->get('to_date');
 
            $attendance = $this->attendanceService->getAllAttendance($perPage, $search, $status, $fromDate, $toDate);
 
            return AttendanceResource::collection($attendance);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch attendance records: ' . $e->getMessage()
            ], 500);
        }
    }

    public function store(AttendanceRequest $request)
    {
        try {
            $attendance = $this->attendanceService->createAttendance($request->validated());
            return new AttendanceResource($attendance);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to record attendance: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $attendance = $this->attendanceService->getAttendanceById($id);
            return new AttendanceResource($attendance);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Attendance record not found.'
            ], 404);
        }
    }

    public function update(AttendanceRequest $request, $id)
    {
        try {
            $attendance = $this->attendanceService->updateAttendance($id, $request->validated());
            return new AttendanceResource($attendance);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update attendance: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $this->attendanceService->deleteAttendance($id);
            return response()->json([
                'success' => true,
                'message' => 'Attendance record deleted successfully'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete record: ' . $e->getMessage()
            ], 500);
        }
    }
}
