<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Address;
use App\Http\Requests\Api\AddressRequest;
use App\Http\Resources\Api\AddressResource;
use Illuminate\Support\Facades\Cache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AddressController extends Controller
{
    /**
     * List addresses with optional search and pagination.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = $request->integer('per_page', 10);
        $search = $request->get('search');

        $query = Address::query();

        if ($search) {
            // Optimized anchored search for name, phone, or email
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "{$search}%")
                  ->orWhere('phone', 'like', "{$search}%")
                  ->orWhere('email', 'like', "{$search}%");
            });
        }

        $addresses = $query->orderBy('id', 'desc')->paginate($perPage);
        return AddressResource::collection($addresses);
    }

    /**
     * Return cached list of active addresses.
     */
    public function active(): AnonymousResourceCollection
    {
        $addresses = Cache::remember('addresses.active_list', 3600, function () {
            return Address::active()->orderBy('name')->get();
        });
        return AddressResource::collection($addresses);
    }

    /**
     * Store a new address.
     */
    public function store(AddressRequest $request): AddressResource
    {
        $address = Address::create($request->validated());
        return new AddressResource($address);
    }

    /**
     * Show a specific address.
     */
    public function show(Address $address): AddressResource
    {
        return new AddressResource($address);
    }

    /**
     * Update an address.
     */
    public function update(AddressRequest $request, Address $address): AddressResource
    {
        $address->update($request->validated());
        return new AddressResource($address);
    }

    /**
     * Delete an address (Soft Delete).
     */
    public function destroy(Address $address): JsonResponse
    {
        $address->delete();
        return response()->json(null, 204);
    }
}
