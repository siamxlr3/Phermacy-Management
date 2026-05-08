<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Medicine;
use Illuminate\Http\Request;
use App\Http\Resources\Api\MedicineResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class MedicineController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search');

        $query = Medicine::query();

        if ($search) {
            // Find categories of medicines that match the search term
            $matchedCategories = Medicine::where('name', 'like', "%{$search}%")
                ->orWhere('generic_name', 'like', "%{$search}%")
                ->orWhere('category_name', 'like', "%{$search}%")
                ->orWhere('manufacturer_name', 'like', "%{$search}%")
                ->whereNotNull('category_name')
                ->distinct()
                ->pluck('category_name')
                ->toArray();

            $query->where(function($q) use ($search, $matchedCategories) {
                if (!empty($matchedCategories)) {
                    // Show all medicines in the matching categories (Alternative suggestions)
                    $q->whereIn('category_name', $matchedCategories);
                }
                
                // Also ensure we match the exact text across other fields just in case
                $q->orWhere('name', 'like', "%{$search}%")
                  ->orWhere('generic_name', 'like', "%{$search}%")
                  ->orWhere('category_name', 'like', "%{$search}%")
                  ->orWhere('manufacturer_name', 'like', "%{$search}%");
            });
        }

        // FIX: simplePaginate avoids the expensive COUNT(*) query at 1M+ rows
        $medicines = $query->orderBy('name')->simplePaginate($perPage);
        return MedicineResource::collection($medicines);
    }

    public function active(): AnonymousResourceCollection
    {
        // FIX: Cache the active list + select only required columns to prevent OOM
        $medicines = Cache::remember('medicines.active_list', 3600, function () {
            return Medicine::where('status', 'Active')
                ->select([
                    'id', 'name', 'dosage_form', 'strength',
                    'tablet_per_stripe', 'stripe_per_box',
                    'price_per_tablet', 'price_per_stripe', 'price_per_box',
                    'volume', 'price', 'stock',
                ])
                ->orderBy('name')
                ->get();
        });

        return MedicineResource::collection($medicines);
    }

    public function store(Request $request): MedicineResource
    {
        $validated = $request->validate($this->buildValidationRules($request));
        $medicine = Medicine::create($validated);
        return new MedicineResource($medicine);
    }

    public function show(Medicine $medicine): MedicineResource
    {
        return new MedicineResource($medicine);
    }

    public function update(Request $request, Medicine $medicine): MedicineResource
    {
        $validated = $request->validate($this->buildValidationRules($request));
        $medicine->update($validated);
        return new MedicineResource($medicine);
    }

    public function destroy(Medicine $medicine): JsonResponse
    {
        // FIX: SoftDelete — medicine is flagged as deleted, related records remain intact
        $medicine->delete();
        return response()->json(null, 204);
    }

    /**
     * Build dynamic validation rules based on the dosage form (Group A vs Group B).
     * Extracted to eliminate duplication between store() and update().
     */
    private function buildValidationRules(Request $request): array
    {
        $isGroupA = in_array($request->dosage_form, ['Tablet', 'Capsule', 'Suppository', 'Patch']);

        $rules = [
            'name' => 'required|string|max:255',
            'generic_name' => 'nullable|string|max:255',
            'category_name' => 'required|string|max:255',
            'manufacturer_name' => 'required|string|max:255',
            'dosage_form' => 'required|string|max:255',
            'strength' => 'nullable|string|max:255',
            'status' => 'required|string|in:Active,Inactive',
            'reorder_level' => 'nullable|integer|min:0',
            'description' => 'nullable|string',
        ];

        if ($isGroupA) {
            $rules['price_per_tablet'] = 'required|numeric|min:0';
            $rules['tablet_per_stripe'] = 'required|integer|min:1';
            $rules['stripe_per_box'] = 'required|integer|min:1';
            $rules['price_per_stripe'] = 'nullable|numeric|min:0';
            $rules['price_per_box'] = 'nullable|numeric|min:0';
        } else {
            $rules['price'] = 'required|numeric|min:0';
            $rules['volume'] = 'required|string|max:255';
        }

        return $rules;
    }
}
