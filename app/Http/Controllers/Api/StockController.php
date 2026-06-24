<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StockIndexRequest;
use App\Http\Requests\Api\StockBatchRequest;
use App\Models\StockBatch;
use App\Models\Medicine;
use App\Http\Resources\Api\StockResource;
use App\Http\Resources\Api\StockBatchResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Cache;

class StockController extends Controller
{
    public function index(StockIndexRequest $request): AnonymousResourceCollection
    {
        $perPage = $request->integer('per_page', 10);
        $search = $request->get('search');
        
        $cacheKey = 'stock' . md5(serialize([
            $perPage,
            $search,
            $request->get('page', 1)
        ]));

        $callback = function () use ($perPage, $search) {
            $query = Medicine::query()
                ->select(['id', 'medicine_name', 'generic_name', 'dosage_form', 'strength', 'category', 'manufacturer', 'is_active', 'reorder_level', 'tablets_per_strip', 'strips_per_box', 'sale_unit_label'])
                ->withSum('stockBatches as total_stock', 'qty_tablets_remaining');

            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('medicine_name', 'like', "{$search}%")
                      ->orWhere('generic_name', 'like', "{$search}%");
                });
            }

            return $query->orderBy('medicine_name')->simplePaginate($perPage);
        };

        if (Cache::getStore() instanceof \Illuminate\Cache\TaggableStore) {
            $medicines = Cache::tags(['stock'])->remember($cacheKey, 3600, $callback);
        } else {
            $medicines = Cache::remember($cacheKey, 3600, $callback);
        }

        return StockResource::collection($medicines);
    }

    public function batches(StockBatchRequest $request): AnonymousResourceCollection
    {
        $perPage = $request->integer('per_page', 10);
        $search = $request->get('search');
        $fromExpiry = $request->get('from_expiry');
        $toExpiry = $request->get('to_expiry');
        $medicineId = $request->get('medicine_id');

        $cacheKey = 'stock_batches_' . md5(serialize([$perPage, $search, $fromExpiry, $toExpiry, $medicineId, $request->get('page', 1)]));

        $callback = function () use ($perPage, $search, $fromExpiry, $toExpiry, $medicineId) {
            $query = StockBatch::query()
                ->select('stock_batches.*')
                ->with([
                    'medicine:id,medicine_name,dosage_form,strength,tablets_per_strip,strips_per_box,sale_unit_label', 
                    'supplier:id,name', 
                    'grn:id,invoice_number'
                ])
                ->join('medicines', 'stock_batches.medicine_id', '=', 'medicines.id');

            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('medicines.medicine_name', 'like', "{$search}%")
                      ->orWhere('stock_batches.batch_number', 'like', "{$search}%");
                });
            }

            if ($medicineId) {
                $query->where('stock_batches.medicine_id', $medicineId);
            }
            if ($fromExpiry && $toExpiry) {
                $query->whereBetween('stock_batches.expiry_date', [$fromExpiry, $toExpiry]);
            }

            return $query->orderBy('stock_batches.expiry_date', 'asc')->paginate($perPage);
        };

        if (Cache::getStore() instanceof \Illuminate\Cache\TaggableStore) {
            $batches = Cache::tags(['stock'])->remember($cacheKey, 3600, $callback);
        } else {
            $batches = Cache::remember($cacheKey, 3600, $callback);
        }

        return StockBatchResource::collection($batches);
    }

    public function medicineBatches(Medicine $medicine): AnonymousResourceCollection
    {
        $batches = StockBatch::where('medicine_id', $medicine->id)
            ->with(['medicine', 'supplier'])
            ->available()
            ->orderBy('expiry_date', 'asc')
            ->simplePaginate(15);
            
        return StockBatchResource::collection($batches);
    }
}
