<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

use Illuminate\Http\Request;
use App\Services\MedicineService;
use App\Http\Requests\Api\StoreMedicineRequest;
use App\Http\Requests\Api\UpdateMedicineRequest;
use App\Http\Resources\Api\MedicineResource;
use App\Models\Medicine;
use Illuminate\Http\JsonResponse;

class MedicineController extends Controller
{
    protected $medicineService;

    public function __construct(MedicineService $medicineService)
    {
        $this->medicineService = $medicineService;
    }

    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search');
        
        $medicines = $this->medicineService->getAllMedicines($perPage, $search);
        return MedicineResource::collection($medicines);
    }

    public function store(StoreMedicineRequest $request)
    {
        $medicine = $this->medicineService->createMedicine($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Medicine created successfully',
            'data' => new MedicineResource($medicine)
        ], 201);
    }

    public function show(Medicine $medicine)
    {
        return new MedicineResource($medicine);
    }

    public function update(UpdateMedicineRequest $request, Medicine $medicine)
    {
        $medicine = $this->medicineService->updateMedicine($medicine, $request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Medicine updated successfully',
            'data' => new MedicineResource($medicine)
        ]);
    }

    public function active()
    {
        $medicines = $this->medicineService->getActiveMedicinesList();
        return MedicineResource::collection($medicines);
    }

    public function destroy(Medicine $medicine)
    {
        $this->medicineService->deleteMedicine($medicine);
        return response()->json([
            'success' => true,
            'message' => 'Medicine deleted successfully'
        ]);
    }
}
