<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Services\ReturnService;
use App\Http\Requests\Api\StoreReturnRequest;
use App\Http\Resources\Api\SalesReturnResource;
use App\Http\Resources\Api\SaleResource;
use Illuminate\Http\JsonResponse;

class ReturnController extends Controller
{
    protected $returnService;

    public function __construct(ReturnService $returnService)
    {
        $this->returnService = $returnService;
    }

    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search');
        $fromDate = $request->get('from_date');
        $toDate = $request->get('to_date');

        $returns = $this->returnService->getReturnHistory($perPage, $search, $fromDate, $toDate);
        return SalesReturnResource::collection($returns);
    }

    public function store(StoreReturnRequest $request): JsonResponse
    {
        try {
            $return = $this->returnService->processReturn($request->validated());
            return response()->json([
                'success' => true,
                'message' => 'Return processed successfully',
                'data' => new SalesReturnResource($return->load('items.medicine'))
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
        $return = $this->returnService->findReturnDetails($id);
        if (!$return) {
            return response()->json(['message' => 'Return not found'], 404);
        }
        return new SalesReturnResource($return);
    }

    public function lookup(string $invoiceNumber)
    {
        $sale = $this->returnService->getSaleForReturn($invoiceNumber);
        if (!$sale) {
            return response()->json(['message' => 'Sale invoice not found'], 404);
        }
        return new SaleResource($sale->load('items.medicine', 'items.returnItems'));
    }
}
