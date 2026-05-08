<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Leave;
use App\Models\Staff;
use Illuminate\Http\Request;
use App\Http\Resources\Api\LeaveResource;
use Illuminate\Support\Facades\Cache;

class LeaveController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search');
        $status = $request->get('status');
        $fromDate = $request->get('from_date');
        $toDate = $request->get('to_date');

        $query = Leave::with(['staff', 'leaveType']);

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
            $query->where(function($q) use ($fromDate, $toDate) {
                $q->whereBetween('start_date', [$fromDate, $toDate])
                  ->orWhereBetween('end_date', [$fromDate, $toDate]);
            });
        }

        $leaves = $query->orderBy('start_date', 'desc')->paginate($perPage);
        return LeaveResource::collection($leaves);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'staff_id' => 'required|exists:staff,id',
            'leave_type_id' => 'required|exists:leave_types,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'required|string',
            'status' => 'required|string|in:Pending,Approved,Rejected',
        ]);

        $leave = Leave::create($validated);
        Cache::flush();
        return new LeaveResource($leave->load(['staff', 'leaveType']));
    }

    public function show(int $id)
    {
        $leave = Leave::with(['staff', 'leaveType'])->findOrFail($id);
        return new LeaveResource($leave);
    }

    public function update(Request $request, int $id)
    {
        $leave = Leave::findOrFail($id);
        $validated = $request->validate([
            'staff_id' => 'required|exists:staff,id',
            'leave_type_id' => 'required|exists:leave_types,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'required|string',
            'status' => 'required|string|in:Pending,Approved,Rejected',
        ]);

        $leave->update($validated);
        Cache::flush();
        return new LeaveResource($leave->load(['staff', 'leaveType']));
    }

    public function destroy(int $id)
    {
        $leave = Leave::findOrFail($id);
        $leave->delete();
        Cache::flush();
        return response()->json(['success' => true, 'message' => 'Leave record deleted successfully']);
    }
}
