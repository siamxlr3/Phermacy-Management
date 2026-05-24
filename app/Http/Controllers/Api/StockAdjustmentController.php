<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StockAdjustment;
use App\Models\Medicine;
use App\Models\StockBatch;
use Illuminate\Http\Request;
use App\Http\Requests\StockAdjustmentRequest;
use App\Http\Resources\Api\StockAdjustmentResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StockAdjustmentController extends Controller
{
    /**
     * List stock adjustments with filtering and caching.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = min($request->integer('per_page', 10), 100);
        $search = $request->get('search');
        $type = $request->get('adjustment_type');
        $fromDate = $request->get('from_date');
        $toDate = $request->get('to_date');

        $cacheKey = "stock_adjustments.list." . md5(serialize($request->all()));

        $adjustments = Cache::tags(['inventory'])->remember($cacheKey, 120, function () use ($perPage, $search, $type, $fromDate, $toDate) {
            $query = StockAdjustment::with(['medicine:id,medicine_name', 'stockBatch:id,batch_number']);

            if ($search) {
                $query->whereHas('medicine', function ($q) use ($search) {
                    $q->where('medicine_name', 'like', "%{$search}%");
                });
            }

            if ($type) {
                $query->where('adjustment_type', $type);
            }

            if ($fromDate && $toDate) {
                $query->whereBetween('created_at', [
                    $fromDate . ' 00:00:00',
                    $toDate . ' 23:59:59'
                ]);
            }

            return $query->latest()->paginate($perPage);
        });

        return StockAdjustmentResource::collection($adjustments);
    }

    /**
     * Store a new stock adjustment and update inventory.
     */
    public function store(StockAdjustmentRequest $request): JsonResponse
    {
        $data = $request->validated();

        try {
            $adjustment = DB::transaction(function () use ($data) {
                // Use lockForUpdate to prevent race conditions on stock updates
                $medicine = Medicine::lockForUpdate()->findOrFail($data['medicine_id']);
                $batch = StockBatch::lockForUpdate()->findOrFail($data['stock_batch_id']);

                // Calculate tablet conversion
                $qtyChangeTablets = $this->calculateTabletEquivalent($medicine, $data['adjustment_unit'], $data['qty_in_units']);

                // Determine if it's an increase or decrease
                $isAddition = ($data['adjustment_type'] === StockAdjustment::TYPE_OPENING_BALANCE);
                
                $qtyBefore = $batch->qty_tablets_remaining;
                $qtyAfter = $isAddition ? ($qtyBefore + $qtyChangeTablets) : ($qtyBefore - $qtyChangeTablets);

                if (!$isAddition && $qtyAfter < 0) {
                    throw new \Exception("Adjustment exceeds available batch stock. Available: {$qtyBefore} tablets.");
                }

                // Create Adjustment Record
                $adjustment = StockAdjustment::create([
                    'medicine_id' => $data['medicine_id'],
                    'stock_batch_id' => $data['stock_batch_id'],
                    'adjustment_type' => $data['adjustment_type'],
                    'adjustment_unit' => $data['adjustment_unit'],
                    'qty_in_units' => $data['qty_in_units'],
                    'qty_change_tablets' => $qtyChangeTablets,
                    'qty_before' => $qtyBefore,
                    'qty_after' => $qtyAfter,
                    'note' => $data['note'],
                ]);

                // Update Batch Stock
                $batch->qty_tablets_remaining = $qtyAfter;
                $batch->save();

                // Update Medicine Total Stock
                if ($isAddition) {
                    $medicine->increment('stock', $qtyChangeTablets);
                } else {
                    $medicine->decrement('stock', $qtyChangeTablets);
                }

                $this->clearCache();

                return $adjustment;
            });

            return response()->json([
                'success' => true,
                'message' => 'Stock adjustment recorded successfully',
                'data' => new StockAdjustmentResource($adjustment->load(['medicine', 'stockBatch']))
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Display the specific adjustment.
     */
    public function show(StockAdjustment $stockAdjustment): StockAdjustmentResource
    {
        return new StockAdjustmentResource($stockAdjustment->load(['medicine', 'stockBatch']));
    }

    /**
     * Delete an adjustment (Soft Delete) and invalidate cache.
     */
    public function destroy(StockAdjustment $stockAdjustment): JsonResponse
    {
        $stockAdjustment->delete();
        $this->clearCache();

        return response()->json([
            'success' => true,
            'message' => 'Adjustment record deleted successfuly'
        ]);
    }

    /**
     * Helper to calculate tablet equivalent based on unit and medicine configuration.
     */
    private function calculateTabletEquivalent(Medicine $medicine, string $unit, int $qty): int
    {
        switch (strtolower($unit)) {
            case StockAdjustment::UNIT_PIECE:
                return $qty;
            case StockAdjustment::UNIT_STRIP:
                return $qty * ($medicine->tablets_per_strip ?? 1);
            case StockAdjustment::UNIT_BOX:
                $perBox = ($medicine->strips_per_box ?? 1) * ($medicine->tablets_per_strip ?? 1);
                return $qty * $perBox;
            default:
                return $qty;
        }
    }

    /**
     * Flush inventory-related caches.
     */
    private function clearCache(): void
    {
        Cache::tags(['inventory', 'dashboard'])->flush();
        Cache::forget('medicines.active_list');
    }
}
