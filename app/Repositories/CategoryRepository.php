<?php

namespace App\Repositories;

use App\Models\Category;

class CategoryRepository
{
    public function getAll(int $perPage = 10, ?string $search = null)
    {
        return Category::query()
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
            })
            ->orderBy('id', 'desc')
            ->paginate($perPage);
    }

    public function getActiveList()
    {
        return Category::where('status', 'Active')->orderBy('name')->get();
    }

    public function findById(int $id)
    {
        return Category::findOrFail($id);
    }

    public function create(array $data)
    {
        return Category::create($data);
    }

    public function update(Category $category, array $data)
    {
        $category->update($data);
        return $category;
    }

    public function delete(Category $category)
    {
        return $category->delete();
    }
}
