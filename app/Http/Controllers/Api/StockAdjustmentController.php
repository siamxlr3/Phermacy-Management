<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StockAdjustment;
use App\Models\Medicine;
use App\Models\StockBatch;
use Illuminate\Http\Request;
use App\Http\Requests\Api\StockAdjustmentRequest;
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

        $callback = function () use ($perPage, $search, $type, $fromDate, $toDate) {
            $query = StockAdjustment::with(['medicine:id,medicine_name', 'stockBatch:id,batch_number']);

            if ($search) {
                // Optimized join/exists to utilize medicine name index
                $query->whereExists(function ($q) use ($search) {
                    $q->select(DB::raw(1))
                      ->from('medicines')
                      ->whereColumn('medicines.id', 'stock_adjustments.medicine_id')
                      ->where('medicine_name', 'like', "{$search}%");
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
        };

        if (Cache::getStore() instanceof \Illuminate\Cache\TaggableStore) {
            $adjustments = Cache::tags(['inventory'])->remember($cacheKey, 120, $callback);
        } else {
            $adjustments = Cache::remember($cacheKey, 120, $callback);
        }

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

                // Calculate tablet conversion via Model helper
                $qtyChangeTablets = StockAdjustment::calculateTablets($medicine, $data['adjustment_unit'], $data['qty_in_units']);

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
                $tabletsPerBox = ($batch->qty_boxes > 0)
                    ? ((float) $batch->qty_tablets / (float) $batch->qty_boxes)
                    : 1;

                // Update Remaining Quantities
                $batch->qty_tablets_remaining = $qtyAfter;
                
                // Track cumulative adjustments for valuation logic (Addition = +, Reduction = -)
                $deltaValuation = $isAddition ? (int) $qtyChangeTablets : -(int) $qtyChangeTablets;
                $batch->qty_adjusted = ($batch->qty_adjusted ?? 0) + $deltaValuation;

                // Keep qty_units_remaining in sync for non-strip medicines
                if ($batch->qty_units_remaining !== null) {
                    $batch->qty_units_remaining = $qtyAfter;
                }

                if ($batch->qty_boxes_remaining !== null && $tabletsPerBox > 0) {
                    $batch->qty_boxes_remaining = round(
                        (float) $batch->qty_tablets_remaining / $tabletsPerBox,
                        4
                    );
                }

                // Update Original Quantities ONLY for opening_balance additions.
                // qty_tablets / qty_boxes represent the original GRN receipt total and
                // must remain immutable for reductions — the Batch Inventory table uses
                // qty_tablets as the "Of X Total" denominator.
                if ($isAddition) {
                    $batch->qty_tablets += $qtyChangeTablets;
                    
                    // Keep qty_units (original total) in sync for non-strip medicines
                    if ($batch->qty_units !== null) {
                        $batch->qty_units += $qtyChangeTablets;
                    }

                    if ($batch->qty_boxes !== null && $tabletsPerBox > 0) {
                        $batch->qty_boxes = round((float) $batch->qty_tablets / $tabletsPerBox, 4);
                    }
                }
                // For reductions: qty_tablets / qty_boxes intentionally left unchanged.

                $batch->save(); // triggers saving event -> calculateValuation() -> ingested_total_cost_value updated

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
        try {
            $stockAdjustment->reverseStockImpact();
            $stockAdjustment->delete();
            $this->clearCache();

            return response()->json([
                'success' => true,
                'message' => 'Adjustment record deleted and stock reversed successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete adjustment: ' . $e->getMessage()
            ], 422);
        }
    }



    /**
     * Flush inventory-related caches.
     */
    private function clearCache(): void
    {
        // Flush 'reports' so InventoryReportController returns live data after adjustments.
        if (Cache::getStore() instanceof \Illuminate\Cache\TaggableStore) {
            Cache::tags(['inventory', 'dashboard', 'stock', 'reports'])->flush();
        } else {
            Cache::flush();
        }
        Cache::forget('medicines.active_list');
    }
}
