<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Medicine;
use Illuminate\Http\Request;
use App\Http\Resources\Api\MedicineResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use App\Http\Requests\Api\StoreMedicineRequest;
use App\Http\Requests\Api\UpdateMedicineRequest;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\MedicineImport;

class MedicineController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search');
        $status = $request->get('status');

        $query = Medicine::query();

        if ($status !== null && $status !== '') {
            $query->where('is_active', $status);
        }

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('medicine_name', 'like', "%{$search}%")
                  ->orWhere('generic_name', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%")
                  ->orWhere('manufacturer', 'like', "%{$search}%");
            });
        }

        $medicines = $query->orderBy('medicine_name')->paginate($perPage);
        return MedicineResource::collection($medicines);
    }

    public function active(): AnonymousResourceCollection
    {
        $medicines = Cache::remember('medicines.active_list', 3600, function () {
            return Medicine::where('is_active', true)
                ->orderBy('medicine_name')
                ->get();
        });

        return MedicineResource::collection($medicines);
    }

    public function store(StoreMedicineRequest $request): MedicineResource
    {
        $medicine = Medicine::create($request->validated());
        return new MedicineResource($medicine);
    }

    public function show(Medicine $medicine): MedicineResource
    {
        return new MedicineResource($medicine);
    }

    public function update(UpdateMedicineRequest $request, Medicine $medicine): MedicineResource
    {
        $medicine->update($request->validated());
        return new MedicineResource($medicine);
    }

    public function destroy(Medicine $medicine): JsonResponse
    {
        $medicine->delete();
        return response()->json(null, 204);
    }

    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:10240',
        ]);

        try {
            Excel::import(new MedicineImport, $request->file('file'));
            return response()->json(['message' => 'Medicines imported successfully']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Import failed: ' . $e->getMessage()], 422);
        }
    }
}
