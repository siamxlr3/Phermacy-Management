<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\SaleService;
use App\Http\Requests\Api\StoreSaleRequest;
use App\Http\Resources\Api\SaleResource;
use Illuminate\Http\JsonResponse;

class SaleController extends Controller
{
    protected $saleService;

    public function __construct(SaleService $saleService)
    {
        $this->saleService = $saleService;
    }

    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search');
        $status = $request->get('status');

        $sales = $this->saleService->getSalesHistory($perPage, $search, $status);
        return SaleResource::collection($sales);
    }

    public function store(StoreSaleRequest $request): JsonResponse
    {
        try {
            $sale = $this->saleService->processSale($request->validated());
            return response()->json([
                'success' => true,
                'message' => 'Sale processed successfully',
                'data' => new SaleResource($sale->load('items.medicine'))
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    public function show(int $id)
    {
        $sale = $this->saleService->getSaleDetails($id);
        if (!$sale) {
            return response()->json(['message' => 'Sale not found'], 404);
        }
        return new SaleResource($sale);
    }
}
