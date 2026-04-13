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
        
        return Cache::remember($cacheKey, 3600, function () use ($perPage, $search, $status, $fromDate, $toDate) {
            return $this->attendanceRepository->getAll($perPage, $search, $status, $fromDate, $toDate);
        });
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
        // Simple strategy: Clear keys matching prefix if using Redis, 
        // or just clear specific list patterns if known.
        // For local development, simpler to clear just list-related ones.
    }
}
