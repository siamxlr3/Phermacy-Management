<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

use Illuminate\Http\Request;
use App\Services\ManufacturerService;
use App\Http\Requests\Api\StoreManufacturerRequest;
use App\Http\Requests\Api\UpdateManufacturerRequest;
use App\Http\Resources\Api\ManufacturerResource;
use App\Models\Manufacturer;

class ManufacturerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    protected $manufacturerService;

    public function __construct(ManufacturerService $manufacturerService)
    {
        $this->manufacturerService = $manufacturerService;
    }

    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search');
        
        $manufacturers = $this->manufacturerService->getAllManufacturers($perPage, $search);
        return ManufacturerResource::collection($manufacturers);
    }

    public function active()
    {
        $manufacturers = $this->manufacturerService->getActiveManufacturersList();
        return response()->json([
            'success' => true,
            'data' => ManufacturerResource::collection($manufacturers)
        ]);
    }

    public function store(StoreManufacturerRequest $request)
    {
        $manufacturer = $this->manufacturerService->createManufacturer($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Manufacturer created successfully',
            'data' => new ManufacturerResource($manufacturer)
        ], 201);
    }

    public function show(Manufacturer $manufacturer)
    {
        return new ManufacturerResource($manufacturer);
    }

    public function update(UpdateManufacturerRequest $request, Manufacturer $manufacturer)
    {
        $manufacturer = $this->manufacturerService->updateManufacturer($manufacturer, $request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Manufacturer updated successfully',
            'data' => new ManufacturerResource($manufacturer)
        ]);
    }

    public function destroy(Manufacturer $manufacturer)
    {
        $this->manufacturerService->deleteManufacturer($manufacturer);
        return response()->json([
            'success' => true,
            'message' => 'Manufacturer deleted successfully'
        ]);
    }
}
