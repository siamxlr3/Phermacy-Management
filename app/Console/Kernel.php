<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Daily inventory alert scan: flags low-stock & expiring medicines/batches
        $schedule->command('alerts:scan-daily')->dailyAt('00:05')
            ->withoutOverlapping()
            ->runInBackground()
            ->appendOutputTo(storage_path('logs/alert-scan.log'));

        // Auto-dismiss resolved alerts — runs before the scan and independently at noon
        $schedule->command('alerts:purge-resolved')->dailyAt('12:00')
            ->withoutOverlapping();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
