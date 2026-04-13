<?php

namespace App\Repositories;

use App\Models\Shift;
use Illuminate\Database\Eloquent\Collection;

class ShiftRepository
{
    public function getAll(int $perPage = 10, ?string $search = null)
    {
        return Shift::query()
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->orderBy('id', 'desc')
            ->paginate($perPage);
    }

    public function getActiveShifts(): Collection
    {
        return Shift::where('status', 'active')->orderBy('name')->get();
    }

    public function findById(int $id): Shift
    {
        return Shift::findOrFail($id);
    }

    public function create(array $data): Shift
    {
        return Shift::create($data);
    }

    public function update(Shift $shift, array $data): Shift
    {
        $shift->update($data);
        return $shift;
    }

    public function delete(Shift $shift): bool
    {
        return $shift->delete();
    }
}
