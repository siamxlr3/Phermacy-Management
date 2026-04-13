<?php

namespace App\Repositories;

use App\Models\Tax;

class TaxRepository
{
    public function getAll(int $perPage = 10, ?string $search = null)
    {
        return Tax::when($search, function ($query, $search) {
                return $query->where('name', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate($perPage);
    }

    public function getActiveList()
    {
        return Tax::where('status', 'Active')->orderBy('name')->get();
    }

    public function create(array $data)
    {
        return Tax::create($data);
    }

    public function update(Tax $tax, array $data)
    {
        $tax->update($data);
        return $tax;
    }

    public function delete(Tax $tax)
    {
        return $tax->delete();
    }
}
