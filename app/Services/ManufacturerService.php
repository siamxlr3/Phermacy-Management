<?php

namespace App\Services;

use App\Repositories\ManufacturerRepository;
use Illuminate\Support\Facades\Cache;
use App\Models\Manufacturer;

class ManufacturerService
{
    protected $manufacturerRepository;

    public function __construct(ManufacturerRepository $manufacturerRepository)
    {
        $this->manufacturerRepository = $manufacturerRepository;
    }

    public function getAllManufacturers(int $perPage = 10, ?string $search = null)
    {
        return $this->manufacturerRepository->getAll($perPage, $search);
    }

    public function getActiveManufacturersList()
    {
        return Cache::remember('manufacturers.active_list', 3600, function () {
            return $this->manufacturerRepository->getActiveList();
        });
    }

    public function createManufacturer(array $data)
    {
        $manufacturer = $this->manufacturerRepository->create($data);
        $this->clearCache();
        return $manufacturer;
    }

    public function updateManufacturer(Manufacturer $manufacturer, array $data)
    {
        $manufacturer = $this->manufacturerRepository->update($manufacturer, $data);
        $this->clearCache();
        return $manufacturer;
    }

    public function deleteManufacturer(Manufacturer $manufacturer)
    {
        $this->manufacturerRepository->delete($manufacturer);
        $this->clearCache();
    }

    protected function clearCache()
    {
        Cache::forget('manufacturers.active_list');
    }
}
