<?php

namespace App\Repositories;

use App\Models\Payroll;
use Illuminate\Pagination\LengthAwarePaginator;

class PayrollRepository
{
    public function getAll(int $perPage = 10, ?string $search = null, ?string $status = null, ?string $fromDate = null, ?string $toDate = null): LengthAwarePaginator
    {
        $query = Payroll::with('staff')->orderBy('created_at', 'desc');

        if ($search) {
            $query->whereHas('staff', function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('employee_id', 'like', "%{$search}%");
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($fromDate && $toDate) {
            $query->whereBetween('created_at', [$fromDate, $toDate]);
        }

        return $query->paginate($perPage);
    }

    public function findById(int $id): Payroll
    {
        return Payroll::with('staff')->findOrFail($id);
    }

    public function create(array $data): Payroll
    {
        return Payroll::create($data);
    }

    public function update(int $id, array $data): Payroll
    {
        $payroll = $this->findById($id);
        $payroll->update($data);
        return $payroll;
    }

    public function delete(int $id): bool
    {
        $payroll = $this->findById($id);
        return $payroll->delete();
    }
}
