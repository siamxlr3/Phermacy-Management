<?php

namespace App\Services;

use App\Repositories\StaffRepository;
use App\Models\Staff;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Exception;

class StaffService
{
    protected $staffRepository;

    public function __construct(StaffRepository $staffRepository)
    {
        $this->staffRepository = $staffRepository;
    }

    public function getAllStaff(
        int $perPage = 10,
        ?string $search = null,
        ?string $status = null,
        ?string $fromDate = null,
        ?string $toDate = null
    ) {
        // Caching list queries with parameters
        $cacheKey = "staff_list_{$perPage}_{$search}_{$status}_{$fromDate}_{$toDate}";
        
        return Cache::remember($cacheKey, 3600, function () use ($perPage, $search, $status, $fromDate, $toDate) {
            return $this->staffRepository->getAll($perPage, $search, $status, $fromDate, $toDate);
        });
    }

    public function createStaff(array $data): Staff
    {
        return DB::transaction(function () use ($data) {
            $data['employee_id'] = $this->generateEmployeeId();
            
            $staff = $this->staffRepository->create($data);
            $this->clearCache();
            return $staff;
        });
    }

    public function updateStaff(int $id, array $data): Staff
    {
        $staff = $this->staffRepository->findById($id);
        $updated = $this->staffRepository->update($staff, $data);
        $this->clearCache();
        return $updated;
    }

    public function deleteStaff(int $id): bool
    {
        $staff = $this->staffRepository->findById($id);
        $deleted = $this->staffRepository->delete($staff);
        $this->clearCache();
        return $deleted;
    }

    public function getActiveStaff()
    {
        return Cache::remember('staff_active', 3600, function () {
            return $this->staffRepository->getActive();
        });
    }

    public function getStaffById(int $id): Staff
    {
        return $this->staffRepository->findById($id);
    }

    /**
     * Logic: EMP-YEAR-SERIAL (e.g. EMP-2026-001)
     */
    protected function generateEmployeeId(): string
    {
        $year = date('Y');
        $prefix = "EMP-{$year}-";
        
        $lastId = $this->staffRepository->getLastEmployeeId();
        
        $serial = 1;
        if ($lastId && str_starts_with($lastId, $prefix)) {
            $lastSerial = (int) substr($lastId, strlen($prefix));
            $serial = $lastSerial + 1;
        }

        return $prefix . str_pad($serial, 3, '0', STR_PAD_LEFT);
    }

    private function clearCache(): void
    {
        // In a production environment with Redis, you'd use tags
        // For now, simplicity or flush if allowed
        // Cache::tags(['staff'])->flush(); 
    }
}
