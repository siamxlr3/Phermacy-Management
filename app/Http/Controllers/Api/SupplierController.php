<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

use App\Models\Supplier;
use App\Services\SupplierService;
use Illuminate\Http\Request;
use App\Http\Requests\Api\StoreSupplierRequest;
use App\Http\Requests\Api\UpdateSupplierRequest;
use App\Http\Resources\Api\SupplierResource;

class SupplierController extends Controller
{
    private SupplierService $supplierService;

    public function __construct(SupplierService $supplierService)
    {
        $this->supplierService = $supplierService;
    }

    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search');
        $status = $request->get('status');
        
        $suppliers = $this->supplierService->getAllSuppliers($perPage, $search, $status);
        return SupplierResource::collection($suppliers);
    }

    public function active()
    {
        $suppliers = $this->supplierService->getActiveSuppliersList();
        return response()->json([
            'success' => true,
            'data' => SupplierResource::collection($suppliers)
        ]);
    }

    public function store(StoreSupplierRequest $request)
    {
        $supplier = $this->supplierService->createSupplier($request->validated());
        return new SupplierResource($supplier);
    }

    public function show(Supplier $supplier)
    {
        return new SupplierResource($supplier);
    }

    public function update(UpdateSupplierRequest $request, Supplier $supplier)
    {
        $supplier = $this->supplierService->updateSupplier($supplier, $request->validated());
        return new SupplierResource($supplier);
    }

    public function destroy(Supplier $supplier)
    {
        $this->supplierService->deleteSupplier($supplier);
        return response()->noContent();
    }
}
