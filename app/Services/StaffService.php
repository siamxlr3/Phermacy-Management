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
        
        $query = function () use ($perPage, $search, $status, $fromDate, $toDate) {
            return $this->staffRepository->getAll($perPage, $search, $status, $fromDate, $toDate);
        };

        if (config('cache.default') !== 'file') {
            return Cache::tags(['staff'])->remember($cacheKey, 3600, $query);
        }

        return Cache::remember($cacheKey, 3600, $query);
    }

    public function createStaff(array $data): Staff
    {
        return DB::transaction(function () use ($data) {
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
        $query = function () {
            return $this->staffRepository->getActive();
        };

        if (config('cache.default') !== 'file') {
            return Cache::tags(['staff'])->remember('staff_active', 3600, $query);
        }

        return Cache::remember('staff_active', 3600, $query);
    }

    public function getStaffById(int $id): Staff
    {
        return $this->staffRepository->findById($id);
    }

    private function clearCache(): void
    {
        if (config('cache.default') !== 'file') {
            Cache::tags(['staff'])->flush();
        } else {
            // For file driver, we must be aggressive
            Cache::flush();
        }
    }
}
