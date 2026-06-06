<?php

namespace App\Jobs;

use App\Services\SaleReportService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Carbon\Carbon;

class UpdateDailySummary implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $date;

    /**
     * Create a new job instance.
     */
    public function __construct(string|Carbon $date)
    {
        $this->date = Carbon::parse($date)->format('Y-m-d');
    }

    /**
     * Execute the job.
     */
    public function handle(SaleReportService $service): void
    {
        $service->aggregateDate($this->date);
    }
}
