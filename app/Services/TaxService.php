<?php

namespace App\Services;

use App\Models\Tax;
use App\Repositories\TaxRepository;
use Illuminate\Support\Facades\Cache;

class TaxService
{
    protected $taxRepository;

    public function __construct(TaxRepository $taxRepository)
    {
        $this->taxRepository = $taxRepository;
    }

    public function getAllTaxes(int $perPage = 10, ?string $search = '')
    {
        return $this->taxRepository->getAll($perPage, $search);
    }

    public function getActiveTaxesList()
    {
        return Cache::remember('taxes.active_list', 3600, function () {
            return $this->taxRepository->getActiveList();
        });
    }

    public function createTax(array $data)
    {
        $tax = $this->taxRepository->create($data);
        $this->clearCache();
        return $tax;
    }

    public function updateTax(Tax $tax, array $data)
    {
        $tax = $this->taxRepository->update($tax, $data);
        $this->clearCache();
        return $tax;
    }

    public function deleteTax(Tax $tax)
    {
        $this->taxRepository->delete($tax);
        $this->clearCache();
    }

    protected function clearCache()
    {
        Cache::forget('taxes.active_list');
    }
}
