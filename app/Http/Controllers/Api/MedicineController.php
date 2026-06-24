<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Medicine;
use App\Models\Category;
use App\Models\Manufacturer;
use Illuminate\Http\Request;
use App\Http\Resources\Api\MedicineResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use App\Http\Requests\Api\MedicineRequest;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\MedicineImport;

class MedicineController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = $request->integer('per_page', 10);
        $search = $request->get('search');
        $status = $request->get('status');
        $all = $request->boolean('all', false);

        if ($status === '1' && $all) {
            $medicines = Cache::remember('medicines.active_with_details', 3600, function () {
                return Medicine::active()
                    ->with(['category', 'manufacturer'])
                    ->orderBy('medicine_name')
                    ->get([
                        'id', 'medicine_name', 'generic_name', 'dosage_form', 'strength',
                        'tablets_per_strip', 'strips_per_box', 'mrp', 'stock', 'package_size',
                        'price_per_unit', 'price_per_stripe', 'price_per_box', 'category_id', 'manufacturer_id'
                    ]);
            });
            return MedicineResource::collection($medicines);
        }

        $query = Medicine::with(['category', 'manufacturer'])
            ->leftJoin('categories', 'medicines.category_id', '=', 'categories.id')
            ->leftJoin('manufacturers', 'medicines.manufacturer_id', '=', 'manufacturers.id')
            ->select([
                'medicines.id', 'medicines.medicine_name', 'medicines.generic_name', 'medicines.category_id', 'medicines.manufacturer_id', 
                'medicines.dosage_form', 'medicines.strength', 'medicines.unit_type', 'medicines.sale_unit_label', 
                'medicines.tablets_per_strip', 'medicines.strips_per_box', 'medicines.package_size',
                'medicines.price_per_unit', 'medicines.price_per_stripe', 'medicines.price_per_box', 'medicines.mrp',
                'medicines.stock', 'medicines.reorder_level', 'medicines.is_active'
            ]);

        if ($status !== null && $status !== '') {
            $query->where('medicines.is_active', $status);
        }

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('medicines.medicine_name', 'like', "{$search}%")
                  ->orWhere('medicines.generic_name', 'like', "{$search}%")
                  ->orWhere('categories.name', 'like', "{$search}%")
                  ->orWhere('manufacturers.name', 'like', "{$search}%");
            });

            // Priority: Direct matches first, then others in the same category
            $query->orderByRaw("CASE 
                WHEN medicine_name LIKE ? THEN 1 
                WHEN generic_name LIKE ? THEN 2 
                ELSE 3 END", ["{$search}%", "{$search}%"]);
        } else {
            $query->orderBy('medicine_name');
        }

        $medicines = $query->paginate($perPage);
        return MedicineResource::collection($medicines);
    }

    public function store(MedicineRequest $request): MedicineResource
    {
        $data = $request->validated();
        
        $category = Category::firstOrCreate(['name' => $data['category']]);
        $manufacturer = Manufacturer::firstOrCreate(['name' => $data['manufacturer']]);
        
        $data['category_id'] = $category->id;
        $data['manufacturer_id'] = $manufacturer->id;
        
        $medicine = Medicine::create($data);
        return new MedicineResource($medicine);
    }

    public function show(Medicine $medicine): MedicineResource
    {
        return new MedicineResource($medicine);
    }

    public function update(MedicineRequest $request, Medicine $medicine): MedicineResource
    {
        $data = $request->validated();
        
        if (isset($data['category'])) {
            $category = Category::firstOrCreate(['name' => $data['category']]);
            $data['category_id'] = $category->id;
        }
        
        if (isset($data['manufacturer'])) {
            $manufacturer = Manufacturer::firstOrCreate(['name' => $data['manufacturer']]);
            $data['manufacturer_id'] = $manufacturer->id;
        }
        
        $medicine->update($data);
        return new MedicineResource($medicine);
    }

    public function destroy(Medicine $medicine): JsonResponse
    {
        if ($medicine->hasDependencies()) {
            return response()->json([
                'message' => 'Cannot delete medicine with existing stock, sales, or adjustments.'
            ], 422);
        }

        $medicine->delete();
        return response()->json(null, 204);
    }

    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:10240',
        ]);

        if (!class_exists('ZipArchive')) {
            return response()->json([
                'message' => 'The PHP Zip extension is not installed or enabled. Please contact your administrator or enable the "zip" extension in php.ini.'
            ], 500);
        }

        try {
            Excel::import(new MedicineImport, $request->file('file'));
            return response()->json(['message' => 'Medicines imported successfully']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Import failed: ' . $e->getMessage()], 422);
        }
    }

    public function categories(): JsonResponse
    {
        return response()->json(Category::orderBy('name')->get(['id', 'name']));
    }

    public function manufacturers(): JsonResponse
    {
        return response()->json(Manufacturer::orderBy('name')->get(['id', 'name']));
    }
}
