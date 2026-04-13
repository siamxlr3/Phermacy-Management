<?php

namespace App\Repositories;

use App\Models\Address;

class AddressRepository
{
    public function getAll(int $perPage = 10, ?string $search = null)
    {
        return Address::when($search, function ($query, $search) {
                return $query->where('email', 'like', "%{$search}%")
                             ->orWhere('phone', 'like', "%{$search}%")
                             ->orWhere('address', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate($perPage);
    }

    public function getActiveList()
    {
        return Address::where('status', 'Active')->orderBy('id', 'desc')->get();
    }

    public function create(array $data)
    {
        return Address::create($data);
    }

    public function update(Address $address, array $data)
    {
        $address->update($data);
        return $address;
    }

    public function delete(Address $address)
    {
        return $address->delete();
    }
}
