<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

use App\Services\AlertService;

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

    protected $alertService;

    public function __construct(AlertService $alertService)
    {
        parent::__construct();
        $this->alertService = $alertService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting inventory alert scan...');

        $this->comment('Scanning for expiring batches...');
        $expiries = $this->alertService->triggerExpiryScan();
        $this->info("Created/Updated {$expiries} expiry alerts.");

        $this->comment('Scanning for low stock medicines...');
        $stockAlerts = $this->alertService->bulkStockCheck();
        $this->info("Processed stock checks for {$stockAlerts} items.");

        $this->info('Inventory scan completed successfully.');
    }
}
