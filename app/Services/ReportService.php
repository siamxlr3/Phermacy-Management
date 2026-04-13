<?php

namespace App\Services;

use App\Repositories\ReportRepository;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class ReportService
{
    protected $reportRepository;

    public function __construct(ReportRepository $reportRepository)
    {
        $this->reportRepository = $reportRepository;
    }

    /**
     * Get a comprehensive dashboard report
     */
    public function getAnalyticsDashboard(array $filters)
    {
        $fromDate = $filters['from_date'] ?? Carbon::now()->subDays(30)->toDateString();
        $toDate = $filters['to_date'] ?? Carbon::now()->toDateString();
        
        // Ensure to_date includes the end of the day
        $fullToDate = Carbon::parse($toDate)->endOfDay()->toDateTimeString();
        $fullFromDate = Carbon::parse($fromDate)->startOfDay()->toDateTimeString();

        $cacheKey = "reports_" . md5($fullFromDate . $fullToDate);

        return Cache::remember($cacheKey, 600, function() use ($fullFromDate, $fullToDate) {
            return [
                'summary' => $this->reportRepository->getSummary($fullFromDate, $fullToDate),
                'daily_sales' => $this->reportRepository->getDailySales($fullFromDate, $fullToDate),
                'top_medicines' => $this->reportRepository->getTopMedicines($fullFromDate, $fullToDate),
                'categories' => $this->reportRepository->getCategoryRevenue($fullFromDate, $fullToDate),
                'payments' => $this->reportRepository->getPaymentMethodBreakdown($fullFromDate, $fullToDate),
                'cashiers' => $this->reportRepository->getCashierSales($fullFromDate, $fullToDate),
                'date_range' => [
                    'from' => $fullFromDate,
                    'to' => $fullToDate
                ]
            ];
        });
    }

    public function clearReportCache()
    {
        // Simple strategy: Clear all keys with "reports_" prefix
        // In a real Redis env, we'd use tags or a more specific flush
        Cache::flush(); // WARNING: Simple but heavy for production. Better to use tags if supported.
    }
}
