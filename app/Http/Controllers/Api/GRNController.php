<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\GRNService;
use App\Http\Requests\Api\StoreGRNRequest;
use App\Http\Requests\Api\UpdateGRNRequest;
use App\Http\Resources\Api\GRNResource;
use App\Http\Resources\Api\PurchaseOrderResource;
use App\Http\Resources\Api\MedicineResource;
use App\Http\Resources\Api\SupplierResource;
use App\Models\GRN;
use Illuminate\Http\JsonResponse;

class GRNController extends Controller
{
    protected $grnService;

    public function __construct(GRNService $grnService)
    {
        $this->grnService = $grnService;
    }

    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search');
        $fromDate = $request->get('from_date');
        $toDate = $request->get('to_date');

        $grns = $this->grnService->getAllGRNs($perPage, $search, $fromDate, $toDate);
        return GRNResource::collection($grns);
    }

    public function store(StoreGRNRequest $request): JsonResponse
    {
        $grn = $this->grnService->createGRN($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'GRN recorded and stock updated successfully',
            'data' => new GRNResource($grn)
        ], 201);
    }

    public function show(int $id)
    {
        $grn = $this->grnService->getGRNDetails($id);
        return new GRNResource($grn);
    }

    public function update(UpdateGRNRequest $request, int $id): JsonResponse
    {
        $grn = GRN::with(['items'])->findOrFail($id);
        $updated = $this->grnService->updateGRN($grn, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'GRN updated and stock re-applied successfully',
            'data'    => new GRNResource($updated),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $grn = GRN::with(['items'])->findOrFail($id);
        $this->grnService->deleteGRN($grn);

        return response()->json([
            'success' => true,
            'message' => 'GRN deleted and stock reversed successfully',
        ]);
    }
}
