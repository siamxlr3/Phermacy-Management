<?php

namespace App\Repositories;

use App\Models\Expense;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ExpenseRepository
{
    public function getList(int $perPage = 10, ?string $search = null, ?string $status = null, ?string $fromDate = null, ?string $toDate = null): LengthAwarePaginator
    {
        $query = Expense::with(['items']);

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('supplier_name', 'like', "%{$search}%")
                  ->orWhere('contact_person', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('address', 'like', "%{$search}%")
                  ->orWhere('transaction_id', 'like', "%{$search}%");
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($fromDate && $toDate) {
            $query->whereBetween('expense_date', [$fromDate, $toDate]);
        }

        return $query->latest('expense_date')->paginate($perPage);
    }

    public function getSummary()
    {
        return Expense::selectRaw('
            SUM(grand_total) as total_expenses,
            SUM(CASE WHEN status = "Paid" THEN grand_total ELSE 0 END) as total_paid,
            SUM(CASE WHEN status = "Unpaid" THEN grand_total ELSE 0 END) as total_unpaid
        ')->first();
    }

    public function findById(int $id): ?Expense
    {
        return Expense::with(['items'])->find($id);
    }

    public function create(array $data): Expense
    {
        return Expense::create($data);
    }

    public function update(Expense $expense, array $data): bool
    {
        return $expense->update($data);
    }

    public function delete(Expense $expense): bool
    {
        return $expense->delete();
    }

    public function generateTransactionId(): string
    {
        $lastExpense = Expense::latest('id')->first();
        $number = $lastExpense ? (int) substr($lastExpense->transaction_id, 4) + 1 : 1;
        return 'EXP-' . str_pad($number, 5, '0', STR_PAD_LEFT);
    }
}
