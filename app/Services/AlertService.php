<?php

namespace App\Services;

use App\Repositories\AlertRepository;
use App\Models\Medicine;
use App\Models\StockBatch;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class AlertService
{
    protected $alertRepository;

    public function __construct(AlertRepository $alertRepository)
    {
        $this->alertRepository = $alertRepository;
    }

    /**
     * Trigger a check for a specific medicine after a sale or adjustment
     */
    public function triggerLowStockCheck(Medicine $medicine): void
    {
        if ($medicine->stock <= $medicine->reorder_level) {
            $severity = 'Warning';
            if ($medicine->stock <= 0) {
                $severity = 'Critical';
            }

            $this->alertRepository->create([
                'medicine_id' => $medicine->id,
                'type' => 'Low Stock',
                'severity' => $severity,
                'message' => "Stock level for {$medicine->name} is low ({$medicine->stock} remaining). Reorder level is {$medicine->reorder_level}.",
                'status' => 'Active',
            ]);
            
            Cache::forget('active_alerts_count');
        }
    }

    /**
     * Resolve/Dismiss low stock alerts if stock is now above threshold
     */
    public function resolveLowStockAlert(Medicine $medicine): void
    {
        if ($medicine->stock > $medicine->reorder_level) {
            $this->alertRepository->dismissByTypeAndMedicine($medicine->id, 'Low Stock');
            Cache::forget('active_alerts_count');
        }
    }

    /**
     * Scan all batches for upcoming expiries
     */
    public function triggerExpiryScan(): int
    {
        $count = 0;
        $today = Carbon::today();
        
        // Windows: 90 days (Info), 60 days (Warning), 30 days (Critical)
        $batches = StockBatch::where('expiry_date', '<=', $today->copy()->addDays(90))
            ->where('qty_tablets_remaining', '>', 0)
            ->with('medicine')
            ->get();

        foreach ($batches as $batch) {
            $expiryDate = Carbon::parse($batch->expiry_date);
            $daysRemaining = $today->diffInDays($expiryDate, false);
            
            $severity = 'Info';
            if ($daysRemaining <= 0) {
                $severity = 'Critical';
                $message = "Batch {$batch->batch_number} of {$batch->medicine->name} has EXPIRED.";
            } elseif ($daysRemaining <= 30) {
                $severity = 'Critical';
                $message = "Batch {$batch->batch_number} of {$batch->medicine->name} expires in {$daysRemaining} days (Highly Critical).";
            } elseif ($daysRemaining <= 60) {
                $severity = 'Warning';
                $message = "Batch {$batch->batch_number} of {$batch->medicine->name} expires in {$daysRemaining} days.";
            } else {
                $severity = 'Info';
                $message = "Batch {$batch->batch_number} of {$batch->medicine->name} expires in {$daysRemaining} days.";
            }

            $this->alertRepository->create([
                'medicine_id' => $batch->medicine_id,
                'stock_batch_id' => $batch->id,
                'type' => 'Expiry',
                'severity' => $severity,
                'message' => $message,
                'status' => 'Active',
            ]);
            $count++;
        }

        if ($count > 0) {
            Cache::forget('active_alerts_count');
        }

        return $count;
    }

    /**
     * Re-validate all medicines for low stock (Daily Job)
     */
    public function bulkStockCheck(): int
    {
        $count = 0;
        $medicines = Medicine::whereRaw('stock <= reorder_level')->get();

        foreach ($medicines as $medicine) {
            $this->triggerLowStockCheck($medicine);
            $count++;
        }

        return $count;
    }

    public function getActiveAlerts(int $perPage = 10, ?string $type = null, ?string $severity = null, ?string $fromDate = null, ?string $toDate = null, ?string $search = null)
    {
        return $this->alertRepository->getActiveAlerts($perPage, $type, $severity, $fromDate, $toDate, $search);
    }

    public function dismissAlert(int $id): bool
    {
        $success = $this->alertRepository->dismiss($id);
        if ($success) {
            Cache::forget('active_alerts_count');
        }
        return $success;
    }

    public function getAlertCount(): int
    {
        return Cache::remember('active_alerts_count', 3600, function () {
            return $this->alertRepository->getActiveCount();
        });
    }
}
