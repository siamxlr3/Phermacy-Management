<?php

namespace App\Repositories;

use App\Models\StockBatch;
use Illuminate\Support\Facades\DB;

class BatchRepository
{
    public function getAll(int $perPage = 10, ?string $search = null, ?array $expiryRange = [])
    {
        $query = StockBatch::with(['medicine', 'supplier', 'grn']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('batch_number', 'like', "%{$search}%")
                  ->orWhereHas('medicine', function ($mq) use ($search) {
                      $mq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        if (!empty($expiryRange)) {
            $query->whereBetween('expiry_date', $expiryRange);
        }

        return $query->orderBy('expiry_date', 'asc')->paginate($perPage);
    }

    public function getAggregatedStock(int $perPage = 10, ?string $search = null)
    {
        $query = StockBatch::with('medicine')
            ->select('medicine_id', 
                DB::raw('SUM(qty_tablets_remaining) as total_stock'),
                DB::raw('MIN(expiry_date) as next_expiry'),
                DB::raw('COUNT(*) as batch_count')
            )
            ->groupBy('medicine_id');

        if ($search) {
            $query->whereHas('medicine', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        return $query->paginate($perPage);
    }

    public function create(array $data)
    {
        return StockBatch::create($data);
    }

    public function findById(int $id)
    {
        return StockBatch::findOrFail($id);
    }
}
