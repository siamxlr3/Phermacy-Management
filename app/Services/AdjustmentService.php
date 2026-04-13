<?php

namespace App\Services;

use App\Repositories\AdjustmentRepository;
use App\Models\StockBatch;
use App\Models\Medicine;
use App\Models\StockAdjustment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Exception;

class AdjustmentService
{
    protected $adjustmentRepository;
    protected $alertService;

    public function __construct(AdjustmentRepository $adjustmentRepository, AlertService $alertService)
    {
        $this->adjustmentRepository = $adjustmentRepository;
        $this->alertService = $alertService;
    }

    /**
     * Handle stock return to supplier logic
     */
    public function createAdjustment(array $data): StockAdjustment
    {
        return DB::transaction(function () use ($data) {
            $batch = StockBatch::findOrFail($data['stock_batch_id']);
            $medicine = Medicine::findOrFail($data['medicine_id']);

            // Validate enough stock exists in batch
            if ($batch->qty_tablets_remaining < abs($data['qty_tablets_changed'])) {
                throw new Exception("Insufficient stock in the selected batch. Available: {$batch->qty_tablets_remaining}");
            }

            // 1. Create adjustment record
            $adjustment = $this->adjustmentRepository->create([
                'medicine_id' => $data['medicine_id'],
                'stock_batch_id' => $data['stock_batch_id'],
                'user_id' => auth()->id() ?? (\App\Models\User::first()->id ?? null),
                'type' => $data['type'],
                'reason' => $data['reason'],
                'qty_tablets_changed' => -$data['qty_tablets_changed'], // Negative change for returns/damages
                'adjustment_date' => $data['adjustment_date'] ?? now(),
            ]);

            // 2. Deduct from Batch
            $batch->decrement('qty_tablets_remaining', $data['qty_tablets_changed']);

            // 3. Deduct from master Medicine stock
            $medicine->decrement('stock', $data['qty_tablets_changed']);

            // Real-time Critical Stock Alert
            $this->alertService->triggerLowStockCheck($medicine->fresh());

            // 4. Invalidate related caches
            $this->clearCaches($medicine->id);

            return $adjustment;
        });
    }

    public function updateAdjustment(StockAdjustment $adjustment, array $data): StockAdjustment
    {
        return DB::transaction(function () use ($adjustment, $data) {
            // 1. Reverse old adjustment
            $oldBatch = StockBatch::find($adjustment->stock_batch_id);
            $oldMedicine = Medicine::find($adjustment->medicine_id);
            $oldQty = abs($adjustment->qty_tablets_changed); // this was deducted

            if ($oldBatch) {
                $oldBatch->increment('qty_tablets_remaining', $oldQty);
            }
            if ($oldMedicine) {
                $oldMedicine->increment('stock', $oldQty);
                // We reversed stock, maybe resolve alert if it's now OK?
                $this->alertService->resolveLowStockAlert($oldMedicine->fresh());
            }

            // 2. Validate and apply new adjustment
            $newBatch = StockBatch::findOrFail($data['stock_batch_id']);
            $newMedicine = Medicine::findOrFail($data['medicine_id']);
            $newQty = $data['qty_tablets_changed'];

            if ($newBatch->qty_tablets_remaining < $newQty) {
                throw new Exception("Insufficient stock in the selected batch. Available: {$newBatch->qty_tablets_remaining}");
            }

            // Update adjustment record
            $adjustment = $this->adjustmentRepository->update($adjustment, [
                'medicine_id' => $data['medicine_id'],
                'stock_batch_id' => $data['stock_batch_id'],
                'type' => $data['type'],
                'reason' => $data['reason'],
                'qty_tablets_changed' => -$newQty, // Negative change
                'adjustment_date' => $data['adjustment_date'] ?? $adjustment->adjustment_date,
            ]);

            // Deduct new amount
            $newBatch->decrement('qty_tablets_remaining', $newQty);
            $newMedicine->decrement('stock', $newQty);

            // Re-check alerts
            $this->alertService->triggerLowStockCheck($newMedicine->fresh());

            // Clear caches
            $this->clearCaches($newMedicine->id);
            if ($oldMedicine && $oldMedicine->id !== $newMedicine->id) {
                $this->clearCaches($oldMedicine->id);
            }

            return $adjustment->fresh(['medicine', 'batch', 'user']);
        });
    }

    public function deleteAdjustment(StockAdjustment $adjustment): void
    {
        DB::transaction(function () use ($adjustment) {
            // Reverse stock
            $batch = StockBatch::find($adjustment->stock_batch_id);
            $medicine = Medicine::find($adjustment->medicine_id);
            $qty = abs($adjustment->qty_tablets_changed);

            if ($batch) {
                $batch->increment('qty_tablets_remaining', $qty);
            }
            if ($medicine) {
                $medicine->increment('stock', $qty);
                $this->alertService->resolveLowStockAlert($medicine->fresh());
                $this->clearCaches($medicine->id);
            }

            $this->adjustmentRepository->delete($adjustment);
        });
    }

    public function getAllAdjustments(int $perPage = 10, ?string $search = null, ?string $status = null, ?string $fromDate = null, ?string $toDate = null)
    {
        return $this->adjustmentRepository->getAdjustmentList($perPage, $search, $status, $fromDate, $toDate);
    }

    private function clearCaches(int $medicineId)
    {
        Cache::forget('stock_overview');
        Cache::forget('stock_batches');
        Cache::forget("medicine_details_{$medicineId}");
    }
}
