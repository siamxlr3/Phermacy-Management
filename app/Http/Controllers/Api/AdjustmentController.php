<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StockAdjustment;
use App\Models\StockBatch;
use App\Models\Medicine;
use Illuminate\Http\Request;
use App\Http\Resources\Api\AdjustmentResource;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Exception;

class AdjustmentController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search');
        $fromDate = $request->get('from_date');
        $toDate = $request->get('to_date');

        $query = StockAdjustment::with(['medicine', 'batch', 'user']);

        if ($search) {
            $query->whereHas('medicine', function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            })->orWhere('reason', 'like', "%{$search}%");
        }

        if ($fromDate && $toDate) {
            $query->whereBetween('adjustment_date', [$fromDate, $toDate]);
        }

        $adjustments = $query->orderBy('adjustment_date', 'desc')->paginate($perPage);
        return AdjustmentResource::collection($adjustments);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'medicine_id' => 'required|exists:medicines,id',
            'stock_batch_id' => 'required|exists:stock_batches,id',
            'type' => 'required|string',
            'reason' => 'required|string',
            'qty_tablets_changed' => 'required|integer|min:1',
            'adjustment_date' => 'nullable|date',
        ]);

        try {
            $adjustment = DB::transaction(function () use ($data) {
                $batch = StockBatch::findOrFail($data['stock_batch_id']);
                $medicine = Medicine::findOrFail($data['medicine_id']);

                if ($batch->qty_tablets_remaining < $data['qty_tablets_changed']) {
                    throw new Exception("Insufficient stock in the selected batch.");
                }

                $adjustment = StockAdjustment::create([
                    'medicine_id' => $data['medicine_id'],
                    'stock_batch_id' => $data['stock_batch_id'],
                    'user_id' => auth()->id() ?? (\App\Models\User::first()->id ?? null),
                    'type' => $data['type'],
                    'reason' => $data['reason'],
                    'qty_tablets_changed' => -$data['qty_tablets_changed'],
                    'adjustment_date' => $data['adjustment_date'] ?? now(),
                ]);

                $batch->decrement('qty_tablets_remaining', $data['qty_tablets_changed']);
                $medicine->decrement('stock', $data['qty_tablets_changed']);

                Cache::flush();
                return $adjustment;
            });

            return response()->json([
                'success' => true,
                'message' => 'Adjustment created successfully',
                'data' => new AdjustmentResource($adjustment->load(['medicine', 'batch', 'user']))
            ], 201);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public function show(int $id)
    {
        $adjustment = StockAdjustment::with(['medicine', 'batch', 'user'])->findOrFail($id);
        return new AdjustmentResource($adjustment);
    }

    public function update(Request $request, int $id)
    {
        $adjustment = StockAdjustment::findOrFail($id);
        $data = $request->validate([
            'medicine_id' => 'required|exists:medicines,id',
            'stock_batch_id' => 'required|exists:stock_batches,id',
            'type' => 'required|string',
            'reason' => 'required|string',
            'qty_tablets_changed' => 'required|integer|min:1',
            'adjustment_date' => 'nullable|date',
        ]);

        try {
            $adjustment = DB::transaction(function () use ($adjustment, $data) {
                // Reverse old
                $oldBatch = StockBatch::find($adjustment->stock_batch_id);
                $oldMedicine = Medicine::find($adjustment->medicine_id);
                $oldQty = abs($adjustment->qty_tablets_changed);

                if ($oldBatch) $oldBatch->increment('qty_tablets_remaining', $oldQty);
                if ($oldMedicine) $oldMedicine->increment('stock', $oldQty);

                // Apply new
                $newBatch = StockBatch::findOrFail($data['stock_batch_id']);
                $newMedicine = Medicine::findOrFail($data['medicine_id']);
                $newQty = $data['qty_tablets_changed'];

                if ($newBatch->qty_tablets_remaining < $newQty) {
                    throw new Exception("Insufficient stock in the selected batch.");
                }

                $adjustment->update([
                    'medicine_id' => $data['medicine_id'],
                    'stock_batch_id' => $data['stock_batch_id'],
                    'type' => $data['type'],
                    'reason' => $data['reason'],
                    'qty_tablets_changed' => -$newQty,
                    'adjustment_date' => $data['adjustment_date'] ?? $adjustment->adjustment_date,
                ]);

                $newBatch->decrement('qty_tablets_remaining', $newQty);
                $newMedicine->decrement('stock', $newQty);

                Cache::flush();
                return $adjustment;
            });

            return response()->json([
                'success' => true,
                'message' => 'Adjustment updated successfully',
                'data' => new AdjustmentResource($adjustment->fresh(['medicine', 'batch', 'user']))
            ]);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public function destroy(int $id)
    {
        $adjustment = StockAdjustment::findOrFail($id);

        try {
            DB::transaction(function () use ($adjustment) {
                $batch = StockBatch::find($adjustment->stock_batch_id);
                $medicine = Medicine::find($adjustment->medicine_id);
                $qty = abs($adjustment->qty_tablets_changed);

                if ($batch) $batch->increment('qty_tablets_remaining', $qty);
                if ($medicine) $medicine->increment('stock', $qty);

                $adjustment->delete();
                Cache::flush();
            });

            return response()->json(['success' => true, 'message' => 'Adjustment deleted successfully']);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }
}
