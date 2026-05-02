<?php

namespace App\Repositories;

use App\Models\Medicine;

class MedicineRepository
{
    public function getAll(int $perPage = 10, ?string $search = null)
    {
        $query = Medicine::query();

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('generic_name', 'like', "%{$search}%")
                  ->orWhere('category_name', 'like', "%{$search}%")
                  ->orWhere('manufacturer_name', 'like', "%{$search}%");
            });

            // Enhancement: Also find other medicines in the same categories as matching ones
            $matchingCategories = Medicine::where('name', 'like', "%{$search}%")
                ->orWhere('generic_name', 'like', "%{$search}%")
                ->pluck('category_name')
                ->unique()
                ->filter();

            if ($matchingCategories->isNotEmpty()) {
                $query->orWhereIn('category_name', $matchingCategories);
            }
        }

        return $query->orderBy('id', 'desc')->paginate($perPage);
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
