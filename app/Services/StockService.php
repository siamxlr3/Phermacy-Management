<?php

namespace App\Services;

use App\Repositories\BatchRepository;
use App\Models\StockBatch;
use Illuminate\Support\Facades\Cache;

class StockService
{
    protected $batchRepository;

    public function __construct(BatchRepository $batchRepository)
    {
        $this->batchRepository = $batchRepository;
    }

    public function getStockOverview(int $perPage = 10, ?string $search = null)
    {
        // Cache aggregated results as it involves heavy GROUP BY
        $cacheKey = "stock.overview.p{$perPage}.s" . ($search ?? 'all');
        
        return Cache::remember($cacheKey, 3600, function () use ($perPage, $search) {
            return $this->batchRepository->getAggregatedStock($perPage, $search);
        });
    }

    public function getBatchDetails(int $perPage = 10, ?string $search = null, ?string $fromExpiry = null, ?string $toExpiry = null)
    {
        $expiryRange = [];
        if ($fromExpiry && $toExpiry) {
            $expiryRange = [$fromExpiry, $toExpiry];
        }
        return $this->batchRepository->getAll($perPage, $search, $expiryRange);
    }

    public function getBatchesByMedicine(int $medicineId)
    {
        return StockBatch::where('medicine_id', $medicineId)
            ->where('qty_tablets_remaining', '>', 0)
            ->orderBy('expiry_date', 'asc')
            ->get();
    }
}
