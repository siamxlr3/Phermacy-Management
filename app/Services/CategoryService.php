<?php

namespace App\Services;

use App\Repositories\CategoryRepository;
use Illuminate\Support\Facades\Cache;
use App\Models\Category;

class CategoryService
{
    protected $categoryRepository;

    public function __construct(CategoryRepository $categoryRepository)
    {
        $this->categoryRepository = $categoryRepository;
    }

    public function getAllCategories(int $perPage = 10, ?string $search = null)
    {
        // Don't strongly cache paginated+searched queries since they vary widely.
        return $this->categoryRepository->getAll($perPage, $search);
    }

    public function getActiveCategoriesList()
    {
        return Cache::remember('categories.active_list', 3600, function () {
            return $this->categoryRepository->getActiveList();
        });
    }

    public function createCategory(array $data)
    {
        $category = $this->categoryRepository->create($data);
        $this->clearCache();
        return $category;
    }

    public function updateCategory(Category $category, array $data)
    {
        $category = $this->categoryRepository->update($category, $data);
        $this->clearCache();
        return $category;
    }

    public function deleteCategory(Category $category)
    {
        $this->categoryRepository->delete($category);
        $this->clearCache();
    }

    protected function clearCache()
    {
        Cache::forget('categories.active_list');
    }
}
