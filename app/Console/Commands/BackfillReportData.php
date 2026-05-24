<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class BackfillReportData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'reports:backfill';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Backfill denormalized data for reports (cost_price in sale_items and total_cost_value in stock_batches)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting backfill of denormalized data...');

        // 1. Backfill StockBatch total_cost_value
        $this->info('Updating stock_batches valuation...');
        \App\Models\StockBatch::with('medicine')->chunk(100, function ($batches) {
            foreach ($batches as $batch) {
                $batch->calculateValuation();
                $batch->saveQuietly(); // Don't trigger observers again
            }
        });

        // 2. Backfill SaleItem cost_price
        $this->info('Updating sale_items cost_price...');
        \App\Models\SaleItem::whereNull('cost_price')->with('batch')->chunk(100, function ($items) {
            foreach ($items as $item) {
                if ($item->batch) {
                    $item->cost_price = $item->batch->cost_per_unit;
                    $item->saveQuietly();
                }
            }
        });

        $this->info('Backfill completed successfully!');
    }
}
