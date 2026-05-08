<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Alert;
use App\Models\Medicine;
use App\Models\StockBatch;
use Carbon\Carbon;

class ProcessInventoryAlerts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'alerts:process';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Scan inventory for low stock levels and upcoming batch expirations';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting inventory alert scan...');

        $this->comment('Scanning for expiring batches...');
        $expiries = $this->triggerExpiryScan();
        $this->info("Created/Updated {$expiries} expiry alerts.");

        $this->comment('Scanning for low stock medicines...');
        $stockAlerts = $this->bulkStockCheck();
        $this->info("Processed stock checks for {$stockAlerts} items.");

        $this->info('Inventory scan completed successfully.');
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
