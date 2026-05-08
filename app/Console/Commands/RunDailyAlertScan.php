<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Alert;
use App\Models\Medicine;
use App\Models\StockBatch;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class RunDailyAlertScan extends Command
{
    /**
     * The name and signature of the console command.
     * Run: php artisan alerts:scan-daily
     */
    protected $signature = 'alerts:scan-daily';

    protected $description = 'Daily job: flag low-stock medicines and expiring batches (30/60/90 days). Writes to alerts table.';

    public function handle(): int
    {
        $this->info('[' . now()->toDateTimeString() . '] Starting daily inventory alert scan...');

        // 1. Purge stale active alerts before re-scanning so we don't accumulate duplicates.
        $this->callSilently('alerts:purge-resolved');

        // 2. Low stock check across all medicines
        $stockCount = $this->bulkStockCheck();
        $this->info("  ✓ Low-stock alerts generated: {$stockCount}");

        // 3. Expiry scan across all active batches
        $expiryCount = $this->triggerExpiryScan();
        $this->info("  ✓ Expiry alerts generated: {$expiryCount}");

        $total = $stockCount + $expiryCount;
        $this->info("  → Total alerts flagged: {$total}");

        Log::info("Daily alert scan completed: {$stockCount} stock alerts, {$expiryCount} expiry alerts.");

        return Command::SUCCESS;
    }

    private function bulkStockCheck(): int
    {
        $count = 0;
        $medicines = Medicine::whereRaw('stock <= reorder_level')->get();

        foreach ($medicines as $medicine) {
            $severity = $medicine->stock <= 0 ? 'Critical' : 'Warning';
            Alert::updateOrCreate(
                ['medicine_id' => $medicine->id, 'type' => 'Low Stock', 'status' => 'Active'],
                [
                    'severity' => $severity,
                    'message' => "Stock level for {$medicine->name} is low ({$medicine->stock} remaining).",
                    'created_at' => now()
                ]
            );
            $count++;
        }
        return $count;
    }

    private function triggerExpiryScan(): int
    {
        $count = 0;
        $today = Carbon::today();
        $batches = StockBatch::where('expiry_date', '<=', $today->copy()->addDays(90))
            ->where('qty_tablets_remaining', '>', 0)
            ->with('medicine')
            ->get();

        foreach ($batches as $batch) {
            $expiryDate = Carbon::parse($batch->expiry_date);
            $daysRemaining = $today->diffInDays($expiryDate, false);
            
            $severity = 'Info';
            if ($daysRemaining <= 0) $severity = 'Critical';
            elseif ($daysRemaining <= 30) $severity = 'Critical';
            elseif ($daysRemaining <= 60) $severity = 'Warning';

            Alert::updateOrCreate(
                ['medicine_id' => $batch->medicine_id, 'stock_batch_id' => $batch->id, 'type' => 'Expiry', 'status' => 'Active'],
                [
                    'severity' => $severity,
                    'message' => "Batch {$batch->batch_number} of {$batch->medicine->name} expires in {$daysRemaining} days.",
                    'created_at' => now()
                ]
            );
            $count++;
        }
        return $count;
    }
}
