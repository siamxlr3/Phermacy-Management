<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StockBatch;
use App\Models\Medicine;
use Illuminate\Http\Request;
use App\Http\Resources\Api\StockResource;
use App\Http\Resources\Api\BatchResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StockController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search');

        $query = Medicine::withSum('stockBatches as total_stock', 'qty_tablets_remaining');

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "{$search}%")
                  ->orWhere('generic_name', 'like', "{$search}%");
            });
        }

        $medicines = $query->orderBy('name')->simplePaginate($perPage);
        return StockResource::collection($medicines);
    }

    public function batches(Request $request): AnonymousResourceCollection
    {
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search');
        $fromExpiry = $request->get('from_expiry');
        $toExpiry = $request->get('to_expiry');

        $query = StockBatch::select('stock_batches.*')
            ->with(['medicine', 'supplier', 'grn'])
            ->join('medicines', 'stock_batches.medicine_id', '=', 'medicines.id');

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('medicines.name', 'like', "{$search}%")
                  ->orWhere('stock_batches.batch_number', 'like', "{$search}%");
            });
        }

        if ($fromExpiry && $toExpiry) {
            $query->whereBetween('stock_batches.expiry_date', [$fromExpiry, $toExpiry]);
        }

        $batches = $query->orderBy('stock_batches.expiry_date', 'asc')->simplePaginate($perPage);
        return BatchResource::collection($batches);
    }

    public function medicineBatches(Medicine $medicine): AnonymousResourceCollection
    {
        $batches = StockBatch::where('medicine_id', $medicine->id)
            ->where('qty_tablets_remaining', '>', 0)
            ->orderBy('expiry_date', 'asc')
            ->get();
            
        return BatchResource::collection($batches);
    }
}
