<?php

namespace App\Services;

use App\Repositories\ShiftRepository;
use App\Models\Shift;
use Illuminate\Support\Facades\Cache;

class ShiftService
{
    protected $shiftRepository;

    public function __construct(ShiftRepository $shiftRepository)
    {
        $this->shiftRepository = $shiftRepository;
    }

    public function getAllShifts(int $perPage = 10, ?string $search = null)
    {
        $cacheKey = "shifts_list_{$perPage}_{$search}";
        
        return Cache::remember($cacheKey, 3600, function () use ($perPage, $search) {
            return $this->shiftRepository->getAll($perPage, $search);
        });
    }

    public function getActiveShifts()
    {
        return Cache::remember('active_shifts', 3600, function () {
            return $this->shiftRepository->getActiveShifts();
        });
    }

    public function createShift(array $data): Shift
    {
        // Calculate total_hours if needed, though usually entered
        $shift = $this->shiftRepository->create($data);
        $this->clearCache();
        return $shift;
    }

    public function updateShift(int $id, array $data): Shift
    {
        $shift = $this->shiftRepository->findById($id);
        $updated = $this->shiftRepository->update($shift, $data);
        $this->clearCache();
        return $updated;
    }

    public function deleteShift(int $id): bool
    {
        $shift = $this->shiftRepository->findById($id);
        $deleted = $this->shiftRepository->delete($shift);
        $this->clearCache();
        return $deleted;
    }

    private function clearCache(): void
    {
        // Targeted clear or flush if using tags
        Cache::forget('active_shifts');
    }
}
