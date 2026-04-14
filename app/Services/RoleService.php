<?php

namespace App\Services;

use App\Repositories\RoleRepository;
use App\Models\Role;
use Illuminate\Support\Facades\Cache;

class RoleService
{
    protected $roleRepository;

    public function __construct(RoleRepository $roleRepository)
    {
        $this->roleRepository = $roleRepository;
    }

    public function getAllRoles(int $perPage = 10, ?string $search = null)
    {
        $cacheKey = "roles_list_{$perPage}_{$search}";
        
        $query = function () use ($perPage, $search) {
            return $this->roleRepository->getAll($perPage, $search);
        };

        if (config('cache.default') !== 'file') {
            return Cache::tags(['roles'])->remember($cacheKey, 3600, $query);
        }

        return Cache::remember($cacheKey, 3600, $query);
    }

    public function getActiveRoles()
    {
        $query = function () {
            return $this->roleRepository->getActiveRoles();
        };

        if (config('cache.default') !== 'file') {
            return Cache::tags(['roles'])->remember('active_roles', 3600, $query);
        }

        return Cache::remember('active_roles', 3600, $query);
    }

    public function createRole(array $data): Role
    {
        $role = $this->roleRepository->create($data);
        $this->clearCache();
        return $role;
    }

    public function updateRole(int $id, array $data): Role
    {
        $role = $this->roleRepository->findById($id);
        $updated = $this->roleRepository->update($role, $data);
        $this->clearCache();
        return $updated;
    }

    public function deleteRole(int $id): bool
    {
        $role = $this->roleRepository->findById($id);
        $deleted = $this->roleRepository->delete($role);
        $this->clearCache();
        return $deleted;
    }

    private function clearCache(): void
    {
        if (config('cache.default') !== 'file') {
            Cache::tags(['roles'])->flush();
        } else {
            Cache::flush(); 
        }
    }
}
