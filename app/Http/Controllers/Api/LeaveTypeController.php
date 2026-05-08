<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LeaveType;
use Illuminate\Http\Request;
use App\Http\Resources\Api\LeaveTypeResource;
use Illuminate\Support\Facades\Cache;

class LeaveTypeController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search');
        $status = $request->get('status');

        $query = LeaveType::query();

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($status) {
            $query->where('status', $status);
        }

        $leaveTypes = $query->orderBy('name')->paginate($perPage);
        return LeaveTypeResource::collection($leaveTypes);
    }

    public function active()
    {
        $leaveTypes = Cache::remember('leavetype_active', 3600, function () {
            return LeaveType::where('status', 'Active')->orderBy('name')->get();
        });
        return LeaveTypeResource::collection($leaveTypes);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:leave_types,name',
            'days_per_year' => 'required|integer|min:0',
            'status' => 'required|string|in:Active,Inactive',
        ]);

        $leaveType = LeaveType::create($validated);
        Cache::flush();
        return new LeaveTypeResource($leaveType);
    }

    public function show(int $id)
    {
        $leaveType = LeaveType::findOrFail($id);
        return new LeaveTypeResource($leaveType);
    }

    public function update(Request $request, int $id)
    {
        $leaveType = LeaveType::findOrFail($id);
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:leave_types,name,' . $id,
            'days_per_year' => 'required|integer|min:0',
            'status' => 'required|string|in:Active,Inactive',
        ]);

        $leaveType->update($validated);
        Cache::flush();
        return new LeaveTypeResource($leaveType);
    }

    public function destroy(int $id)
    {
        $leaveType = LeaveType::findOrFail($id);
        $leaveType->delete();
        Cache::flush();
        return response()->json(['success' => true, 'message' => 'Leave type deleted successfully']);
    }
}
