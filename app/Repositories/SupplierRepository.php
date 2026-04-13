<?php

namespace App\Repositories;

use App\Models\Supplier;

class SupplierRepository
{
    public function getAll(int $perPage = 10, ?string $search = null, ?string $status = null)
    {
        return Supplier::query()
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('contact_person', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%");
            })
            ->when($status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->orderBy('id', 'desc')
            ->paginate($perPage);
    }

    public function getActiveList()
    {
        return Supplier::where('status', 'Active')->orderBy('name')->get();
    }

    public function findById(int $id)
    {
        return Supplier::findOrFail($id);
    }

    public function create(array $data)
    {
        return Supplier::create($data);
    }

    public function update(Supplier $supplier, array $data)
    {
        $supplier->update($data);
        return $supplier;
    }

    public function delete(Supplier $supplier)
    {
        return $supplier->delete();
    }
}
