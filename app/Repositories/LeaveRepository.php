<?php

namespace App\Repositories;

use App\Models\Leave;
use Illuminate\Pagination\LengthAwarePaginator;

class LeaveRepository
{
    public function getAll(
        int $perPage = 10,
        ?string $search = null,
        ?string $status = null,
        ?string $fromDate = null,
        ?string $toDate = null
    ): LengthAwarePaginator {
        return Leave::query()
            ->with(['staff', 'type'])
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
                $query->where(function ($q) use ($fromDate, $toDate) {
                    $q->whereBetween('start_date', [$fromDate, $toDate])
                      ->orWhereBetween('end_date', [$fromDate, $toDate]);
                });
            })
            ->orderBy('id', 'desc')
            ->paginate($perPage);
    }

    public function findById(int $id): Leave
    {
        return Leave::with(['staff', 'type'])->findOrFail($id);
    }

    public function create(array $data): Leave
    {
        return Leave::create($data);
    }

    public function update(Leave $leave, array $data): Leave
    {
        $leave->update($data);
        return $leave;
    }

    public function delete(Leave $leave): bool
    {
        return $leave->delete();
    }
}
