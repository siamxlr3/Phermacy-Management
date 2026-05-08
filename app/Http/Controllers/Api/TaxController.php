<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tax;
use App\Http\Requests\Api\StoreTaxRequest;
use App\Http\Requests\Api\UpdateTaxRequest;
use App\Http\Resources\Api\TaxResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\JsonResponse;

class TaxController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search');

        $query = Tax::query();

        if ($search) {
            $query->where('name', 'like', "{$search}%");
        }

        $taxes = $query->orderBy('name')->simplePaginate($perPage);
        return TaxResource::collection($taxes);
    }

    public function store(StoreTaxRequest $request): TaxResource
    {
        $tax = Tax::create($request->validated());
        return new TaxResource($tax);
    }

    public function show(Tax $tax): TaxResource
    {
        return new TaxResource($tax);
    }

    public function update(UpdateTaxRequest $request, Tax $tax): TaxResource
    {
        $tax->update($request->validated());
        return new TaxResource($tax);
    }

    public function destroy(Tax $tax): JsonResponse
    {
        $tax->delete();
        return response()->json(null, 204);
    }
}
