<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\AlertService;
use Illuminate\Support\Facades\Log;

class RunDailyAlertScan extends Command
{
    /**
     * The name and signature of the console command.
     * Run: php artisan alerts:scan-daily
     */
    protected $signature = 'alerts:scan-daily';

    protected $description = 'Daily job: flag low-stock medicines and expiring batches (30/60/90 days). Writes to alerts table.';

    public function __construct(protected AlertService $alertService)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $this->info('[' . now()->toDateTimeString() . '] Starting daily inventory alert scan...');

        // 1. Purge stale active alerts before re-scanning so we don't accumulate duplicates.
        //    The AlertRepository::create() uses updateOrCreate, but purging first
        //    ensures alerts for fixed stock are automatically cleared.
        $this->callSilently('alerts:purge-resolved');

        // 2. Low stock check across all medicines
        $stockCount = $this->alertService->bulkStockCheck();
        $this->info("  ✓ Low-stock alerts generated: {$stockCount}");

        // 3. Expiry scan across all active batches
        $expiryCount = $this->alertService->triggerExpiryScan();
        $this->info("  ✓ Expiry alerts generated: {$expiryCount}");

        $total = $stockCount + $expiryCount;
        $this->info("  → Total alerts flagged: {$total}");

        Log::info("Daily alert scan completed: {$stockCount} stock alerts, {$expiryCount} expiry alerts.");

        return Command::SUCCESS;
    }
}
