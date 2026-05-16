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
        $perPage = $request->integer('per_page', 10);
        $search = $request->get('search');
        $status = $request->get('status');

        $query = Medicine::query()->select([
            'id', 'medicine_name', 'generic_name', 'category', 'manufacturer', 
            'dosage_form', 'strength', 'unit_type', 'sale_unit_label', 
            'tablets_per_strip', 'strips_per_box', 'package_size',
            'price_per_unit', 'price_per_stripe', 'price_per_box', 'mrp', 'cost_price',
            'stock', 'reorder_level', 'is_active'
        ]);

        if ($status !== null && $status !== '') {
            $query->where('is_active', $status);
        }

        if ($search) {
            // Find categories of medicines that match the search term to include "category peers"
            $matchedCategories = Medicine::where('medicine_name', 'like', "{$search}%")
                ->orWhere('generic_name', 'like', "{$search}%")
                ->pluck('category')
                ->unique()
                ->filter()
                ->toArray();

            $query->where(function($q) use ($search, $matchedCategories) {
                $q->where('medicine_name', 'like', "{$search}%")
                  ->orWhere('generic_name', 'like', "{$search}%")
                  ->orWhere('category', 'like', "{$search}%")
                  ->orWhere('manufacturer', 'like', "{$search}%");
                
                if (!empty($matchedCategories)) {
                    $q->orWhereIn('category', $matchedCategories);
                }
            });

            // Priority: Direct matches first, then others in the same category
            $query->orderByRaw("CASE 
                WHEN medicine_name LIKE ? THEN 1 
                WHEN generic_name LIKE ? THEN 2 
                ELSE 3 END", ["{$search}%", "{$search}%"]);
        } else {
            $query->orderBy('medicine_name');
        }

        $medicines = $query->simplePaginate($perPage);
        return MedicineResource::collection($medicines);
    }

    public function active(): AnonymousResourceCollection
    {
        $medicines = Cache::remember('medicines.active_list', 3600, function () {
            return Medicine::active()
                ->orderBy('medicine_name')
                ->get(['id', 'medicine_name', 'generic_name', 'dosage_form', 'strength']);
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
