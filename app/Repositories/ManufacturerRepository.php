<?php

namespace App\Repositories;

use App\Models\Manufacturer;

class ManufacturerRepository
{
    public function getAll(int $perPage = 10, ?string $search = null)
    {
        return Manufacturer::query()
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
            })
            ->orderBy('id', 'desc')
            ->paginate($perPage);
    }

    public function getActiveList()
    {
        return Manufacturer::where('status', 'Active')->orderBy('name')->get();
    }

    public function findById(int $id)
    {
        return Manufacturer::findOrFail($id);
    }

    public function create(array $data)
    {
        return Manufacturer::create($data);
    }

    public function update(Manufacturer $manufacturer, array $data)
    {
        $manufacturer->update($data);
        return $manufacturer;
    }

    public function delete(Manufacturer $manufacturer)
    {
        return $manufacturer->delete();
    }
}
