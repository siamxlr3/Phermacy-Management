<?php

namespace App\Repositories;

use App\Models\StockAdjustment;
use Illuminate\Pagination\LengthAwarePaginator;

class AdjustmentRepository
{
    /**
     * Get paginated adjustments with filters
     */
    public function getAdjustmentList(int $perPage = 10, ?string $search = null, ?string $status = null, ?string $fromDate = null, ?string $toDate = null): LengthAwarePaginator
    {
        $query = StockAdjustment::with(['medicine', 'batch', 'user']);

        if ($search) {
            $query->whereHas('medicine', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            })->orWhere('reason', 'like', "%{$search}%");
        }

        if ($status) {
            $query->where('type', $status);
        }

        if ($fromDate && $toDate) {
            $query->whereBetween('adjustment_date', [$fromDate, $toDate]);
        }

        return $query->latest('adjustment_date')->paginate($perPage);
    }

    public function create(array $data): StockAdjustment
    {
        return StockAdjustment::create($data);
    }

    public function update(StockAdjustment $adjustment, array $data): StockAdjustment
    {
        $adjustment->update($data);
        return $adjustment;
    }

    public function delete(StockAdjustment $adjustment): bool
    {
        return $adjustment->delete();
    }
}
