<?php

namespace App\Services;

use App\Models\Address;
use App\Repositories\AddressRepository;
use Illuminate\Support\Facades\Cache;

class AddressService
{
    protected $addressRepository;

    public function __construct(AddressRepository $addressRepository)
    {
        $this->addressRepository = $addressRepository;
    }

    public function getAllAddresses(int $perPage = 10, ?string $search = '')
    {
        return $this->addressRepository->getAll($perPage, $search);
    }

    public function getActiveAddressesList()
    {
        return Cache::remember('addresses.active_list', 3600, function () {
            return $this->addressRepository->getActiveList();
        });
    }

    public function createAddress(array $data)
    {
        $address = $this->addressRepository->create($data);
        $this->clearCache();
        return $address;
    }

    public function updateAddress(Address $address, array $data)
    {
        $address = $this->addressRepository->update($address, $data);
        $this->clearCache();
        return $address;
    }

    public function deleteAddress(Address $address)
    {
        $this->addressRepository->delete($address);
        $this->clearCache();
    }

    protected function clearCache()
    {
        Cache::forget('addresses.active_list');
    }
}
