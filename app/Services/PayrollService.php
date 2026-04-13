<?php

namespace App\Services;

use App\Repositories\PayrollRepository;
use Illuminate\Support\Facades\Cache;
use App\Models\Payroll;

class PayrollService
{
    protected $payrollRepository;

    public function __construct(PayrollRepository $payrollRepository)
    {
        $this->payrollRepository = $payrollRepository;
    }

    public function getAllPayroll(int $perPage = 10, ?string $search = null, ?string $status = null, ?string $fromDate = null, ?string $toDate = null)
    {
        $cacheKey = "payroll_list_{$perPage}_{$search}_{$status}_{$fromDate}_{$toDate}_" . request('page', 1);

        return Cache::remember($cacheKey, 3600, function () use ($perPage, $search, $status, $fromDate, $toDate) {
            return $this->payrollRepository->getAll($perPage, $search, $status, $fromDate, $toDate);
        });
    }

    public function getPayrollById(int $id): Payroll
    {
        return $this->payrollRepository->findById($id);
    }

    public function createPayroll(array $data): Payroll
    {
        // Proposed Logic: Automatic Net Salary Calculation
        if (!isset($data['net_salary'])) {
            $basic = $data['basic_salary'] ?? 0;
            $bonus = $data['bonus'] ?? 0;
            $deduction = $data['deduction'] ?? 0;
            $data['net_salary'] = $basic + $bonus - $deduction;
        }

        if (isset($data['status']) && $data['status'] === 'paid' && !isset($data['paid_at'])) {
            $data['paid_at'] = now();
        }

        $payroll = $this->payrollRepository->create($data);
        $this->clearCache();
        return $payroll;
    }

    public function updatePayroll(int $id, array $data): Payroll
    {
        if (isset($data['status']) && $data['status'] === 'paid' && !isset($data['paid_at'])) {
            $data['paid_at'] = now();
        }

        $payroll = $this->payrollRepository->update($id, $data);
        $this->clearCache();
        return $payroll;
    }

    public function deletePayroll(int $id): bool
    {
        $deleted = $this->payrollRepository->delete($id);
        $this->clearCache();
        return $deleted;
    }

    protected function clearCache(): void
    {
        // Simple cache clearing for demo; in production use tags or specific keys
        Cache::flush(); 
    }
}
