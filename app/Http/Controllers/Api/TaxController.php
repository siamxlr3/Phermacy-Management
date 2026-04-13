<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

use App\Models\Tax;
use App\Services\TaxService;
use Illuminate\Http\Request;
use App\Http\Requests\Api\StoreTaxRequest;
use App\Http\Requests\Api\UpdateTaxRequest;
use App\Http\Resources\Api\TaxResource;

class TaxController extends Controller
{
    private TaxService $taxService;

    public function __construct(TaxService $taxService)
    {
        $this->taxService = $taxService;
    }

    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search');
        
        $taxes = $this->taxService->getAllTaxes($perPage, $search);
        return TaxResource::collection($taxes);
    }

    public function active()
    {
        $taxes = $this->taxService->getActiveTaxesList();
        return response()->json([
            'success' => true,
            'data' => TaxResource::collection($taxes)
        ]);
    }

    public function store(StoreTaxRequest $request)
    {
        $tax = $this->taxService->createTax($request->validated());
        return new TaxResource($tax);
    }

    public function show(Tax $tax)
    {
        return new TaxResource($tax);
    }

    public function update(UpdateTaxRequest $request, Tax $tax)
    {
        $tax = $this->taxService->updateTax($tax, $request->validated());
        return new TaxResource($tax);
    }

    public function destroy(Tax $tax)
    {
        $this->taxService->deleteTax($tax);
        return response()->noContent();
    }
}
