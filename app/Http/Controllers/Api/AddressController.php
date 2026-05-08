<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Address;
use Illuminate\Http\Request;
use App\Http\Resources\Api\AddressResource;
use Illuminate\Support\Facades\Cache;

class AddressController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search');

        $query = Address::query();

        if ($search) {
            $query->where('address_line_1', 'like', "%{$search}%")
                  ->orWhere('city', 'like', "%{$search}%")
                  ->orWhere('state', 'like', "%{$search}%");
        }

        $addresses = $query->orderBy('id', 'desc')->paginate($perPage);
        return AddressResource::collection($addresses);
    }

    public function active()
    {
        $addresses = Cache::remember('addresses.active_list', 3600, function () {
            return Address::where('status', 'Active')->get();
        });
        return AddressResource::collection($addresses);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'address_line_1' => 'required|string|max:255',
            'address_line_2' => 'nullable|string|max:255',
            'city' => 'required|string|max:100',
            'state' => 'required|string|max:100',
            'zip_code' => 'required|string|max:20',
            'status' => 'required|string|in:Active,Inactive',
        ]);

        $address = Address::create($validated);
        Cache::forget('addresses.active_list');
        return new AddressResource($address);
    }

    public function show(int $id)
    {
        $address = Address::findOrFail($id);
        return new AddressResource($address);
    }

    public function update(Request $request, int $id)
    {
        $address = Address::findOrFail($id);
        $validated = $request->validate([
            'address_line_1' => 'required|string|max:255',
            'address_line_2' => 'nullable|string|max:255',
            'city' => 'required|string|max:100',
            'state' => 'required|string|max:100',
            'zip_code' => 'required|string|max:20',
            'status' => 'required|string|in:Active,Inactive',
        ]);

        $address->update($validated);
        Cache::forget('addresses.active_list');
        return new AddressResource($address);
    }

    public function destroy(int $id)
    {
        $address = Address::findOrFail($id);
        $address->delete();
        Cache::forget('addresses.active_list');
        return response()->json(['success' => true, 'message' => 'Address deleted successfully']);
    }
}
