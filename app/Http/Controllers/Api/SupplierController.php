<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Http\Requests\Api\StoreSupplierRequest;
use App\Http\Requests\Api\UpdateSupplierRequest;
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

        $query = Supplier::query();

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "{$search}%")
                  ->orWhere('email', 'like', "{$search}%")
                  ->orWhere('phone', 'like', "{$search}%");
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        $suppliers = $query->orderBy('name')->simplePaginate($perPage);
        return SupplierResource::collection($suppliers);
    }

    public function active(): AnonymousResourceCollection
    {
        $suppliers = Cache::remember('suppliers.active_list', 3600, function () {
            return Supplier::where('status', 'Active')
                ->select('id', 'name', 'phone') // Optimized select for dropdowns
                ->orderBy('name')
                ->get();
        });
        
        return SupplierResource::collection($suppliers);
    }

    public function store(StoreSupplierRequest $request): SupplierResource
    {
        $supplier = Supplier::create($request->validated());
        return new SupplierResource($supplier);
    }

    public function show(Supplier $supplier): SupplierResource
    {
        return new SupplierResource($supplier);
    }

    public function update(UpdateSupplierRequest $request, Supplier $supplier): SupplierResource
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
