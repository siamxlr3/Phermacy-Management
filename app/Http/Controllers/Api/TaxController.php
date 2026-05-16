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
    /**
     * List taxes with optional search and pagination.
     * Uses optimized indexing for name searches.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = $request->integer('per_page', 10);
        $search = $request->get('search');

        // High-performance path: If no search, hit the DB with optimized query
        $query = Tax::query()->select(['id', 'name', 'rate', 'status']);

        if ($search) {
            // Anchored search to utilize B-Tree index on 'name'
            $query->where('name', 'like', "{$search}%");
        }

        $taxes = $query->orderBy('name')->simplePaginate($perPage);
        return TaxResource::collection($taxes);
    }

    /**
     * For internal lookups (e.g., POS), use the cached retrieval directly.
     */
    public function listActive(): AnonymousResourceCollection
    {
        $taxes = \Illuminate\Support\Facades\Cache::remember('taxes.active_list', 3600, function () {
            return Tax::active()->orderBy('name')->get(['id', 'name', 'rate']);
        });

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
