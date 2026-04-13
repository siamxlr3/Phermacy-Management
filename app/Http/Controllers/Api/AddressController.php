<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

use App\Models\Address;
use App\Services\AddressService;
use Illuminate\Http\Request;
use App\Http\Requests\Api\StoreAddressRequest;
use App\Http\Requests\Api\UpdateAddressRequest;
use App\Http\Resources\Api\AddressResource;

class AddressController extends Controller
{
    private AddressService $addressService;

    public function __construct(AddressService $addressService)
    {
        $this->addressService = $addressService;
    }

    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search');
        
        $addresses = $this->addressService->getAllAddresses($perPage, $search);
        return AddressResource::collection($addresses);
    }

    public function active()
    {
        $addresses = $this->addressService->getActiveAddressesList();
        return response()->json([
            'success' => true,
            'data' => AddressResource::collection($addresses)
        ]);
    }

    public function store(StoreAddressRequest $request)
    {
        $address = $this->addressService->createAddress($request->validated());
        return new AddressResource($address);
    }

    public function show(Address $address)
    {
        return new AddressResource($address);
    }

    public function update(UpdateAddressRequest $request, Address $address)
    {
        $address = $this->addressService->updateAddress($address, $request->validated());
        return new AddressResource($address);
    }

    public function destroy(Address $address)
    {
        $this->addressService->deleteAddress($address);
        return response()->noContent();
    }
}
