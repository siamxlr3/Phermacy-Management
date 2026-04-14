<?php

namespace App\Services;

use App\Repositories\LeaveTypeRepository;
use App\Models\LeaveType;
use Illuminate\Support\Facades\Cache;

class LeaveTypeService
{
    protected $leaveTypeRepository;

    public function __construct(LeaveTypeRepository $leaveTypeRepository)
    {
        $this->leaveTypeRepository = $leaveTypeRepository;
    }

    public function getAllLeaveTypes(int $perPage = 10, ?string $search = null, ?string $status = null)
    {
        $cacheKey = "leavetype_list_{$perPage}_{$search}_{$status}";
        
        $query = function () use ($perPage, $search, $status) {
            return $this->leaveTypeRepository->getAll($perPage, $search, $status);
        };

        if (config('cache.default') !== 'file') {
            return Cache::tags(['leavetypes'])->remember($cacheKey, 3600, $query);
        }

        return Cache::remember($cacheKey, 3600, $query);
    }

    public function getActiveLeaveTypes()
    {
        $query = function () {
            return $this->leaveTypeRepository->getActive();
        };

        if (config('cache.default') !== 'file') {
            return Cache::tags(['leavetypes'])->remember('leavetype_active', 3600, $query);
        }

        return Cache::remember('leavetype_active', 3600, $query);
    }

    public function createLeaveType(array $data): LeaveType
    {
        $leaveType = $this->leaveTypeRepository->create($data);
        $this->clearCache();
        return $leaveType;
    }

    public function updateLeaveType(int $id, array $data): LeaveType
    {
        $leaveType = $this->leaveTypeRepository->findById($id);
        $updated = $this->leaveTypeRepository->update($leaveType, $data);
        $this->clearCache();
        return $updated;
    }

    public function deleteLeaveType(int $id): bool
    {
        $leaveType = $this->leaveTypeRepository->findById($id);
        $deleted = $this->leaveTypeRepository->delete($leaveType);
        $this->clearCache();
        return $deleted;
    }

    public function getLeaveTypeById(int $id): LeaveType
    {
        return $this->leaveTypeRepository->findById($id);
    }

    private function clearCache(): void
    {
        if (config('cache.default') !== 'file') {
            Cache::tags(['leavetypes'])->flush();
        } else {
            // For file driver, we must be aggressive
            Cache::flush();
        }
    }
}
