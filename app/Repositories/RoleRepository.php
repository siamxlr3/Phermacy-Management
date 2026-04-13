<?php

namespace App\Repositories;

use App\Models\Role;
use Illuminate\Database\Eloquent\Collection;

class RoleRepository
{
    public function getAll(int $perPage = 10, ?string $search = null)
    {
        return Role::query()
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->orderBy('id', 'desc')
            ->paginate($perPage);
    }

    public function getActiveRoles(): Collection
    {
        return Role::where('status', 'active')->orderBy('name')->get();
    }

    public function findById(int $id): Role
    {
        return Role::findOrFail($id);
    }

    public function create(array $data): Role
    {
        return Role::create($data);
    }

    public function update(Role $role, array $data): Role
    {
        $role->update($data);
        return $role;
    }

    public function delete(Role $role): bool
    {
        return $role->delete();
    }
}
