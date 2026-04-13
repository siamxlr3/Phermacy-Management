<?php

namespace App\Services;

use App\Models\Supplier;
use App\Repositories\SupplierRepository;
use Illuminate\Support\Facades\Cache;

class SupplierService
{
    protected $supplierRepository;

    public function __construct(SupplierRepository $supplierRepository)
    {
        $this->supplierRepository = $supplierRepository;
    }

    public function getAllSuppliers(int $perPage = 10, ?string $search = null, ?string $status = null)
    {
        return $this->supplierRepository->getAll($perPage, $search, $status);
    }

    public function getActiveSuppliersList()
    {
        return Cache::remember('suppliers.active_list', 3600, function () {
            return $this->supplierRepository->getActiveList();
        });
    }

    public function createSupplier(array $data)
    {
        $supplier = $this->supplierRepository->create($data);
        $this->clearCache();
        return $supplier;
    }

    public function updateSupplier(Supplier $supplier, array $data)
    {
        $supplier = $this->supplierRepository->update($supplier, $data);
        $this->clearCache();
        return $supplier;
    }

    public function deleteSupplier(Supplier $supplier)
    {
        $this->supplierRepository->delete($supplier);
        $this->clearCache();
    }

    protected function clearCache()
    {
        Cache::forget('suppliers.active_list');
    }
}
