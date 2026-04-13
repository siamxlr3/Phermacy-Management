<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\RoleRequest;
use App\Http\Resources\Api\RoleResource;
use App\Services\RoleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    protected $roleService;

    public function __construct(RoleService $roleService)
    {
        $this->roleService = $roleService;
    }

    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search');
        
        $roles = $this->roleService->getAllRoles($perPage, $search);
        return RoleResource::collection($roles);
    }

    public function active()
    {
        $roles = $this->roleService->getActiveRoles();
        return RoleResource::collection($roles);
    }

    public function store(RoleRequest $request): JsonResponse
    {
        try {
            $role = $this->roleService->createRole($request->validated());
            return response()->json([
                'success' => true,
                'message' => 'Role created successfully',
                'data' => new RoleResource($role)
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    public function show($id): RoleResource
    {
        $role = $this->roleService->updateRole($id, []); // Just finding by ID essentially
        return new RoleResource($role);
    }

    public function update(RoleRequest $request, $id): JsonResponse
    {
        try {
            $role = $this->roleService->updateRole($id, $request->validated());
            return response()->json([
                'success' => true,
                'message' => 'Role updated successfully',
                'data' => new RoleResource($role)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            $this->roleService->deleteRole($id);
            return response()->json([
                'success' => true,
                'message' => 'Role deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }
}
