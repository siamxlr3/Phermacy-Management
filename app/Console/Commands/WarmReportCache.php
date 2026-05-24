<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class WarmReportCache extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'reports:warm';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Pre-calculate and warm the dashboard report cache';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Warming dashboard report cache...');

        $ranges = [
            'last_30_days' => [
                'from' => now()->subDays(30)->toDateString(),
                'to'   => now()->toDateString()
            ],
            'this_month' => [
                'from' => now()->startOfMonth()->toDateString(),
                'to'   => now()->toDateString()
            ],
            'last_month' => [
                'from' => now()->subMonth()->startOfMonth()->toDateString(),
                'to'   => now()->subMonth()->endOfMonth()->toDateString()
            ]
        ];

        foreach ($ranges as $name => $range) {
            $this->info("Calculating for {$name}...");
            
            // Mock a request to the dashboard logic
            // Since we moved logic to models, we can just call the model methods or trigger the controller
            // For simplicity and directness, we will hit the controller logic via a simulated request
            
            $request = new \Illuminate\Http\Request([
                'from_date' => $range['from'],
                'to_date'   => $range['to'],
            ]);

            app(\App\Http\Controllers\Api\ReportController::class)->dashboard($request);
        }

        $this->info('Cache warming completed!');
    }
}
