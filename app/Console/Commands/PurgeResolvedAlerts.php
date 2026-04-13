<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Alert;
use App\Models\Medicine;
use App\Models\StockBatch;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class PurgeResolvedAlerts extends Command
{
    protected $signature = 'alerts:purge-resolved';
    protected $description = 'Dismiss alerts where the underlying issue is now resolved (stock replenished, batch gone).';

    public function handle(): int
    {
        $purged = 0;

        // 1. Dismiss Low Stock alerts where stock is now above reorder_level
        Alert::where('type', 'Low Stock')
            ->where('status', 'Active')
            ->with('medicine')
            ->get()
            ->each(function (Alert $alert) use (&$purged) {
                $medicine = $alert->medicine;
                if ($medicine && $medicine->stock > $medicine->reorder_level) {
                    $alert->update(['status' => 'Dismissed']);
                    $purged++;
                }
            });

        // 2. Dismiss Expiry alerts where the batch no longer has remaining stock
        Alert::where('type', 'Expiry')
            ->where('status', 'Active')
            ->with('stockBatch')
            ->get()
            ->each(function (Alert $alert) use (&$purged) {
                $batch = $alert->stockBatch;
                if ($batch && $batch->qty_tablets_remaining <= 0) {
                    $alert->update(['status' => 'Dismissed']);
                    $purged++;
                }
            });

        $this->info("Purged {$purged} resolved alerts.");
        Log::info("alerts:purge-resolved completed: {$purged} alerts auto-dismissed.");

        return Command::SUCCESS;
    }
}
