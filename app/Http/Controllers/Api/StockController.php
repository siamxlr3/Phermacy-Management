<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\StockService;
use App\Http\Resources\Api\BatchResource;
use App\Http\Resources\Api\MedicineResource;
use App\Http\Resources\Api\SupplierResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StockController extends Controller
{
    protected $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    /**
     * Aggregated stock view
     */
    public function overview(Request $request)
    {
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search');

        $stock = $this->stockService->getStockOverview($perPage, $search);
        
        // We handle aggregation resource mapping manually or return as is
        return response()->json([
            'success' => true,
            'data' => $stock
        ]);
    }

    /**
     * Individual batch view
     */
    public function batches(Request $request): AnonymousResourceCollection
    {
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search');
        $fromExpiry = $request->get('from_expiry');
        $toExpiry = $request->get('to_expiry');

        $batches = $this->stockService->getBatchDetails($perPage, $search, $fromExpiry, $toExpiry);
        return BatchResource::collection($batches);
    }

    /**
     * Get available batches for a medicine
     */
    public function batchesByMedicine(int $medicineId)
    {
        $batches = $this->stockService->getBatchesByMedicine($medicineId);
        return BatchResource::collection($batches);
    }
}
