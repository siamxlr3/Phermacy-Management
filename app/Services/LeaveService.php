<?php

namespace App\Services;

use App\Repositories\LeaveRepository;
use App\Models\Leave;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class LeaveService
{
    protected $leaveRepository;

    public function __construct(LeaveRepository $leaveRepository)
    {
        $this->leaveRepository = $leaveRepository;
    }

    public function getAllLeaves(
        int $perPage = 10,
        ?string $search = null,
        ?string $status = null,
        ?string $fromDate = null,
        ?string $toDate = null
    ) {
        $cacheKey = "leave_list_{$perPage}_{$search}_{$status}_{$fromDate}_{$toDate}";
        return Cache::remember($cacheKey, 3600, function () use ($perPage, $search, $status, $fromDate, $toDate) {
            return $this->leaveRepository->getAll($perPage, $search, $status, $fromDate, $toDate);
        });
    }

    public function createLeave(array $data): Leave
    {
        $leave = $this->leaveRepository->create($data);
        $this->clearCache();
        return $leave;
    }

    public function updateLeave(int $id, array $data): Leave
    {
        $leave = $this->leaveRepository->findById($id);
        $updated = $this->leaveRepository->update($leave, $data);
        $this->clearCache();
        return $updated;
    }

    public function deleteLeave(int $id): bool
    {
        $leave = $this->leaveRepository->findById($id);
        $deleted = $this->leaveRepository->delete($leave);
        $this->clearCache();
        return $deleted;
    }

    public function getLeaveById(int $id): Leave
    {
        return $this->leaveRepository->findById($id);
    }

    private function clearCache(): void
    {
        // Cache clearing logic
    }
}
