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
        Medicine::whereRaw('stock <= reorder_level')->chunk(100, function ($medicines) use (&$count) {
            foreach ($medicines as $medicine) {
                $severity = $medicine->stock <= 0 ? Alert::SEVERITY_CRITICAL : Alert::SEVERITY_WARNING;
                Alert::updateOrCreate(
                    [
                        'medicine_id' => $medicine->id, 
                        'type' => Alert::TYPE_LOW_STOCK, 
                        'status' => Alert::STATUS_ACTIVE
                    ],
                    [
                        'severity' => $severity,
                        'message' => "Stock level for {$medicine->medicine_name} is low ({$medicine->stock} remaining).",
                        'created_at' => now()
                    ]
                );
                $count++;
            }
        });
        return $count;
    }

    private function triggerExpiryScan(): int
    {
        $count = 0;
        $today = Carbon::today();
        StockBatch::where('expiry_date', '<=', $today->copy()->addDays(90))
            ->where('qty_tablets_remaining', '>', 0)
            ->with('medicine')
            ->chunk(100, function ($batches) use ($today, &$count) {
                foreach ($batches as $batch) {
                    $expiryDate = Carbon::parse($batch->expiry_date);
                    $daysRemaining = $today->diffInDays($expiryDate, false);
                    
                    $severity = Alert::SEVERITY_INFO;
                    if ($daysRemaining <= 30) $severity = Alert::SEVERITY_CRITICAL;
                    elseif ($daysRemaining <= 60) $severity = Alert::SEVERITY_WARNING;

                    Alert::updateOrCreate(
                        [
                            'medicine_id' => $batch->medicine_id, 
                            'stock_batch_id' => $batch->id, 
                            'type' => Alert::TYPE_EXPIRY, 
                            'status' => Alert::STATUS_ACTIVE
                        ],
                        [
                            'severity' => $severity,
                            'message' => "Batch {$batch->batch_number} of {$batch->medicine->medicine_name} expires in {$daysRemaining} days.",
                            'created_at' => now()
                        ]
                    );
                    $count++;
                }
            });
        return $count;
    }
}
