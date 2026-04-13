<?php

namespace App\Repositories;

use App\Models\LeaveType;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class LeaveTypeRepository
{
    public function getAll(
        int $perPage = 10,
        ?string $search = null,
        ?string $status = null
    ): LengthAwarePaginator {
        return LeaveType::query()
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->when($status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->orderBy('id', 'desc')
            ->paginate($perPage);
    }

    public function getActive(): Collection
    {
        return LeaveType::where('status', 'active')->get();
    }

    public function findById(int $id): LeaveType
    {
        return LeaveType::findOrFail($id);
    }

    public function create(array $data): LeaveType
    {
        return LeaveType::create($data);
    }

    public function update(LeaveType $leaveType, array $data): LeaveType
    {
        $leaveType->update($data);
        return $leaveType;
    }

    public function delete(LeaveType $leaveType): bool
    {
        return $leaveType->delete();
    }
}
