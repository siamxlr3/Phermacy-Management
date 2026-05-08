<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Staff;
use Illuminate\Http\Request;
use App\Http\Resources\Api\AttendanceResource;
use Illuminate\Support\Facades\Cache;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search');
        $status = $request->get('status');
        $fromDate = $request->get('from_date');
        $toDate = $request->get('to_date');

        $query = Attendance::with('staff');

        if ($search) {
            $query->whereHas('staff', function($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('employee_id', 'like', "%{$search}%");
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($fromDate && $toDate) {
            $query->whereBetween('date', [$fromDate, $toDate]);
        }

        $attendance = $query->orderBy('date', 'desc')->paginate($perPage);
        return AttendanceResource::collection($attendance);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'staff_id' => 'required|exists:staff,id',
            'date' => 'required|date',
            'check_in' => 'nullable|string',
            'check_out' => 'nullable|string',
            'status' => 'required|string|in:Present,Absent,Late,Half Day',
            'notes' => 'nullable|string',
        ]);

        $attendance = Attendance::create($validated);
        Cache::flush();
        return new AttendanceResource($attendance->load('staff'));
    }

    public function show(int $id)
    {
        $attendance = Attendance::with('staff')->findOrFail($id);
        return new AttendanceResource($attendance);
    }

    public function update(Request $request, int $id)
    {
        $attendance = Attendance::findOrFail($id);
        $validated = $request->validate([
            'staff_id' => 'required|exists:staff,id',
            'date' => 'required|date',
            'check_in' => 'nullable|string',
            'check_out' => 'nullable|string',
            'status' => 'required|string|in:Present,Absent,Late,Half Day',
            'notes' => 'nullable|string',
        ]);

        $attendance->update($validated);
        Cache::flush();
        return new AttendanceResource($attendance->load('staff'));
    }

    public function destroy(int $id)
    {
        $attendance = Attendance::findOrFail($id);
        $attendance->delete();
        Cache::flush();
        return response()->json(['success' => true, 'message' => 'Attendance record deleted successfully']);
    }
}
