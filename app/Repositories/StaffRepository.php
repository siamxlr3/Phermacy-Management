<?php

namespace App\Repositories;

use App\Models\Staff;
use Illuminate\Pagination\LengthAwarePaginator;

class StaffRepository
{
    public function getAll(
        int $perPage = 10,
        ?string $search = null,
        ?string $status = null,
        ?string $fromDate = null,
        ?string $toDate = null
    ): LengthAwarePaginator {
        return Staff::query()
            ->with(['role', 'shift'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('full_name', 'like', "%{$search}%")
                      ->orWhere('employee_id', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('address', 'like', "%{$search}%");
                });
            })
            ->when($status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($fromDate && $toDate, function ($query) use ($fromDate, $toDate) {
                $query->whereBetween('join_date', [$fromDate, $toDate]);
            })
            ->orderBy('id', 'desc')
            ->paginate($perPage);
    }

    public function findById(int $id): Staff
    {
        return Staff::with(['role', 'shift'])->findOrFail($id);
    }

    public function create(array $data): Staff
    {
        return Staff::create($data);
    }

    public function update(Staff $staff, array $data): Staff
    {
        $staff->update($data);
        return $staff;
    }

    public function delete(Staff $staff): bool
    {
        return $staff->delete();
    }

    public function getActive(): \Illuminate\Database\Eloquent\Collection
    {
        return Staff::where('status', 'active')->orderBy('full_name')->get();
    }

    public function getLastEmployeeId(): ?string
    {
        return Staff::orderBy('id', 'desc')->value('employee_id');
    }
}
