<?php

namespace App\Services;

use App\Repositories\InventoryReportRepository;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class InventoryReportService
{
    protected $reportRepository;

    public function __construct(InventoryReportRepository $reportRepository)
    {
        $this->reportRepository = $reportRepository;
    }

    /**
     * Consolidate inventory health analytics
     */
    public function getInventoryAnalytics(array $filters)
    {
        // For filtering the Expiry Table, default to today -> next 90 days if not provided
        $filterFrom = $filters['from_date'] ?? Carbon::now()->toDateString();
        $filterTo = $filters['to_date'] ?? Carbon::now()->addDays(90)->toDateString();

        $cacheKey = "inventory_reports_mixed_" . md5($filterFrom . $filterTo);

        return Cache::remember($cacheKey, 3600, function() use ($filterFrom, $filterTo) {
            // "Global" components - status quo/current state
            $valuation = $this->reportRepository->getStockValuation();
            $paymentDues = $this->reportRepository->getSupplierPaymentDue();
            $globalExpiryRisksTotal = $this->reportRepository->getNearExpiryStock(90);

            return [
                'valuation' => $valuation,
                'expiry_risks' => [
                    'critical' => $this->reportRepository->getNearExpiryStock(30), // Still useful for color coding/alerts
                    'warning' => $this->reportRepository->getExpiryRiskInRange($filterFrom, $filterTo), // UI TABLE
                ],
                'slow_moving' => $this->reportRepository->getSlowMovingStock(90),
                'dues' => $paymentDues,
                'summaries' => [
                    'total_stock_value' => $valuation->sum('total_value'),
                    'total_pending_payments' => $paymentDues->sum('balance_due'),
                    'expiry_count' => $globalExpiryRisksTotal->count(),
                    'low_stock_count' => $this->reportRepository->getLowStockCount(),
                    'category_count' => $valuation->count()
                ]
            ];
        });
    }

    public function clearCache()
    {
        Cache::forget('inventory_reports_' . '*'); // Theoretical, usually Cache::flush() in this simple setup
        Cache::flush();
    }
}
