<?php

namespace App\Services;

use App\Repositories\MedicineRepository;
use App\Models\Medicine;
use Illuminate\Support\Facades\Cache;

class MedicineService
{
    protected $medicineRepository;

    public function __construct(MedicineRepository $medicineRepository)
    {
        $this->medicineRepository = $medicineRepository;
    }

    public function getAllMedicines(int $perPage = 10, ?string $search = null)
    {
        return $this->medicineRepository->getAll($perPage, $search);
    }

    public function getActiveMedicinesList()
    {
        return Cache::remember('medicines.active_list', 3600, function () {
            return $this->medicineRepository->getActiveList();
        });
    }

    public function createMedicine(array $data)
    {
        $medicine = $this->medicineRepository->create($data);
        Cache::forget('medicines.active_list');
        return $medicine;
    }

    public function updateMedicine(Medicine $medicine, array $data)
    {
        $medicine = $this->medicineRepository->update($medicine, $data);
        Cache::forget('medicines.active_list');
        return $medicine;
    }

    public function deleteMedicine(Medicine $medicine)
    {
        $this->medicineRepository->delete($medicine);
        Cache::forget('medicines.active_list');
    }
}
