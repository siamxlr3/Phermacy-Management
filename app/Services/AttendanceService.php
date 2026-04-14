<?php

namespace App\Services;

use App\Repositories\AttendanceRepository;
use App\Models\Attendance;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AttendanceService
{
    protected $attendanceRepository;

    public function __construct(AttendanceRepository $attendanceRepository)
    {
        $this->attendanceRepository = $attendanceRepository;
    }

    public function getAllAttendance(
        int $perPage = 10,
        ?string $search = null,
        ?string $status = null,
        ?string $fromDate = null,
        ?string $toDate = null
    ) {
        $cacheKey = "attendance_list_{$perPage}_{$search}_{$status}_{$fromDate}_{$toDate}";
        
        $query = function () use ($perPage, $search, $status, $fromDate, $toDate) {
            return $this->attendanceRepository->getAll($perPage, $search, $status, $fromDate, $toDate);
        };

        if (config('cache.default') !== 'file') {
            return Cache::tags(['attendance'])->remember($cacheKey, 3600, $query);
        }

        return Cache::remember($cacheKey, 3600, $query);
    }

    public function createAttendance(array $data): Attendance
    {
        $attendance = $this->attendanceRepository->create($data);
        $this->clearCache();
        return $attendance;
    }

    public function updateAttendance(int $id, array $data): Attendance
    {
        $attendance = $this->attendanceRepository->findById($id);
        $updated = $this->attendanceRepository->update($attendance, $data);
        $this->clearCache();
        return $updated;
    }

    public function deleteAttendance(int $id): bool
    {
        $attendance = $this->attendanceRepository->findById($id);
        $deleted = $this->attendanceRepository->delete($attendance);
        $this->clearCache();
        return $deleted;
    }

    public function getAttendanceById(int $id): Attendance
    {
        return $this->attendanceRepository->findById($id);
    }

    private function clearCache(): void
    {
        if (config('cache.default') !== 'file') {
            Cache::tags(['attendance'])->flush();
        } else {
            // For file driver, we must be aggressive
            Cache::flush();
        }
    }
}
