<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Staff;
use Illuminate\Http\Request;
use App\Http\Resources\Api\StaffResource;
use Illuminate\Support\Facades\Cache;

class StaffController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search');
        $status = $request->get('status');
        $fromDate = $request->get('from_date');
        $toDate = $request->get('to_date');

        $query = Staff::query();

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('employee_id', 'like', "%{$search}%");
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($fromDate && $toDate) {
            $query->whereBetween('join_date', [$fromDate, $toDate]);
        }

        $staff = $query->orderBy('first_name')->paginate($perPage);
        return StaffResource::collection($staff);
    }

    public function active()
    {
        $staff = Cache::remember('staff_active', 3600, function () {
            return Staff::where('status', 'Active')->orderBy('first_name')->get();
        });
        return StaffResource::collection($staff);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|string|unique:staff,employee_id',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:staff,email',
            'phone' => 'required|string|max:20',
            'designation' => 'required|string',
            'department' => 'required|string',
            'join_date' => 'required|date',
            'salary' => 'required|numeric|min:0',
            'status' => 'required|string|in:Active,Inactive,On Leave',
        ]);

        $staff = Staff::create($validated);
        Cache::flush();
        return new StaffResource($staff);
    }

    public function show(int $id)
    {
        $staff = Staff::findOrFail($id);
        return new StaffResource($staff);
    }

    public function update(Request $request, int $id)
    {
        $staff = Staff::findOrFail($id);
        $validated = $request->validate([
            'employee_id' => 'required|string|unique:staff,employee_id,' . $id,
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:staff,email,' . $id,
            'phone' => 'required|string|max:20',
            'designation' => 'required|string',
            'department' => 'required|string',
            'join_date' => 'required|date',
            'salary' => 'required|numeric|min:0',
            'status' => 'required|string|in:Active,Inactive,On Leave',
        ]);

        $staff->update($validated);
        Cache::flush();
        return new StaffResource($staff);
    }

    public function destroy(int $id)
    {
        $staff = Staff::findOrFail($id);
        $staff->delete();
        Cache::flush();
        return response()->json(['success' => true, 'message' => 'Staff deleted successfully']);
    }
}
