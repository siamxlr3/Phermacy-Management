<?php

namespace App\Services;

use App\Repositories\ExpenseRepository;
use App\Models\Expense;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Exception;

class ExpenseService
{
    protected $expenseRepository;

    public function __construct(ExpenseRepository $expenseRepository)
    {
        $this->expenseRepository = $expenseRepository;
    }

    public function getExpenses(int $perPage = 10, ?string $search = null, ?string $status = null, ?string $fromDate = null, ?string $toDate = null)
    {
        $cacheKey = "expenses_list_{$perPage}_{$search}_{$status}_{$fromDate}_{$toDate}_page_" . request()->get('page', 1);

        return Cache::remember($cacheKey, 600, function () use ($perPage, $search, $status, $fromDate, $toDate) {
            return $this->expenseRepository->getList($perPage, $search, $status, $fromDate, $toDate);
        });
    }

    public function getExpenseSummary()
    {
        return Cache::remember('expenses_summary', 600, function () {
            $summary = $this->expenseRepository->getSummary();
            return [
                'total_expenses' => $summary->total_expenses ?? 0,
                'total_paid' => $summary->total_paid ?? 0,
                'total_unpaid' => $summary->total_unpaid ?? 0,
            ];
        });
    }

    public function getExpenseById(int $id)
    {
        return $this->expenseRepository->findById($id);
    }

    public function createExpense(array $data): Expense
    {
        return DB::transaction(function () use ($data) {
            $data['transaction_id'] = $this->expenseRepository->generateTransactionId();
            $data['expense_date'] = $data['expense_date'] ?? now()->toDateString();
            
            $expense = $this->expenseRepository->create($data);

            if (isset($data['items']) && is_array($data['items'])) {
                foreach ($data['items'] as $item) {
                    $expense->items()->create($item);
                }
            }

            $this->clearCache();

            return $expense->load('items');
        });
    }

    public function updateExpense(Expense $expense, array $data): Expense
    {
        return DB::transaction(function () use ($expense, $data) {
            $this->expenseRepository->update($expense, $data);

            if (isset($data['items']) && is_array($data['items'])) {
                $expense->items()->delete();
                foreach ($data['items'] as $item) {
                    $expense->items()->create($item);
                }
            }

            $this->clearCache();

            return $expense->fresh('items');
        });
    }

    public function deleteExpense(Expense $expense): bool
    {
        $this->clearCache();
        return $this->expenseRepository->delete($expense);
    }

    private function clearCache()
    {
        try {
            if (Cache::supportsTags()) {
                Cache::tags(['Expense'])->flush();
            } else {
                Cache::forget('expenses_summary');
            }
        } catch (\Exception $e) {
            //
        }
    }
}
