<?php

namespace App\Repositories;

use App\Models\Medicine;

class MedicineRepository
{
    public function getAll(int $perPage = 10, ?string $search = null)
    {
        return Medicine::query()
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('generic_name', 'like', "%{$search}%")
                      ->orWhere('category_name', 'like', "%{$search}%")
                      ->orWhere('manufacturer_name', 'like', "%{$search}%");
            })
            ->orderBy('id', 'desc')
            ->paginate($perPage);
    }

    public function findById(int $id)
    {
        return Medicine::findOrFail($id);
    }

    public function create(array $data)
    {
        return Medicine::create($data);
    }

    public function update(Medicine $medicine, array $data)
    {
        $medicine->update($data);
        return $medicine;
    }

    public function delete(Medicine $medicine)
    {
        return $medicine->delete();
    }

    public function getActiveList()
    {
        return Medicine::query()
            ->where('status', 'Active')
            ->orderBy('name')
            ->get();
    }
}
