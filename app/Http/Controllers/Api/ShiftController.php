<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use Illuminate\Http\Request;
use App\Http\Resources\Api\ShiftResource;
use Illuminate\Support\Facades\Cache;

class ShiftController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search');

        $query = Shift::query();

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        $shifts = $query->orderBy('start_time')->paginate($perPage);
        return ShiftResource::collection($shifts);
    }

    public function active()
    {
        $shifts = Cache::remember('active_shifts', 3600, function () {
            return Shift::where('status', 'Active')->orderBy('start_time')->get();
        });
        return ShiftResource::collection($shifts);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'start_time' => 'required|string',
            'end_time' => 'required|string',
            'status' => 'required|string|in:Active,Inactive',
        ]);

        $shift = Shift::create($validated);
        Cache::flush();
        return new ShiftResource($shift);
    }

    public function show(int $id)
    {
        $shift = Shift::findOrFail($id);
        return new ShiftResource($shift);
    }

    public function update(Request $request, int $id)
    {
        $shift = Shift::findOrFail($id);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'start_time' => 'required|string',
            'end_time' => 'required|string',
            'status' => 'required|string|in:Active,Inactive',
        ]);

        $shift->update($validated);
        Cache::flush();
        return new ShiftResource($shift);
    }

    public function destroy(int $id)
    {
        $shift = Shift::findOrFail($id);
        $shift->delete();
        Cache::flush();
        return response()->json(['success' => true, 'message' => 'Shift deleted successfully']);
    }
}
