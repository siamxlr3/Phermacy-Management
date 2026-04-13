<?php

namespace App\Repositories;

use App\Models\Attendance;
use Illuminate\Pagination\LengthAwarePaginator;

class AttendanceRepository
{
    public function getAll(
        int $perPage = 10,
        ?string $search = null,
        ?string $status = null,
        ?string $fromDate = null,
        ?string $toDate = null
    ): LengthAwarePaginator {
        return Attendance::query()
            ->with(['staff', 'shift'])
            ->when($search, function ($query, $search) {
                $query->whereHas('staff', function ($q) use ($search) {
                    $q->where('full_name', 'like', "%{$search}%")
                      ->orWhere('employee_id', 'like', "%{$search}%");
                });
            })
            ->when($status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($fromDate && $toDate, function ($query) use ($fromDate, $toDate) {
                $query->whereBetween('date', [$fromDate, $toDate]);
            })
            ->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate($perPage);
    }

    public function findById(int $id): Attendance
    {
        return Attendance::with(['staff', 'shift'])->findOrFail($id);
    }

    public function create(array $data): Attendance
    {
        return Attendance::create($data);
    }

    public function update(Attendance $attendance, array $data): Attendance
    {
        $attendance->update($data);
        return $attendance;
    }

    public function delete(Attendance $attendance): bool
    {
        return $attendance->delete();
    }
}
