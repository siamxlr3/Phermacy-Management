<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Http\Requests\Api\SupplierRequest;
use App\Http\Resources\Api\SupplierResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class SupplierController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search');
        $status = $request->get('status');
        $all = $request->boolean('all', false);

        if ($status === 'Active' && $all) {
            $suppliers = Cache::remember('suppliers.active_list', 3600, function () {
                return Supplier::where('status', 'Active')
                    ->select('id', 'name', 'phone')
                    ->orderBy('name')
                    ->get();
            });
            return SupplierResource::collection($suppliers);
        }

        $query = Supplier::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                // Prefix search is index-friendly
                $q->where('name', 'like', $search . '%')
                  ->orWhere('phone', 'like', $search . '%')
                  ->orWhere('email', 'like', $search . '%');
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        $suppliers = $query->orderBy('name')->simplePaginate($perPage);
        return SupplierResource::collection($suppliers);
    }

    public function store(SupplierRequest $request): SupplierResource
    {
        $supplier = Supplier::create($request->validated());
        return new SupplierResource($supplier);
    }

    public function show(Supplier $supplier): SupplierResource
    {
        return new SupplierResource($supplier);
    }

    public function update(SupplierRequest $request, Supplier $supplier): SupplierResource
    {
        $supplier->update($request->validated());
        return new SupplierResource($supplier);
    }

    public function destroy(Supplier $supplier): JsonResponse
    {
        $supplier->delete();
        return response()->json(null, 204);
    }
}
