<?php

namespace App\Services;

use App\Repositories\CashRegisterRepository;
use App\Models\Sale;
use App\Models\CashRegister;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class CashRegisterService
{
    protected $repository;

    public function __construct(CashRegisterRepository $repository)
    {
        $this->repository = $repository;
    }

    public function openRegister(int $userId, float $openingBalance): CashRegister
    {
        return $this->repository->create([
            'shift_date' => Carbon::now()->toDateString(),
            'user_id' => $userId,
            'opening_balance' => $openingBalance,
            'expected_cash' => $openingBalance,
            'status' => 'open',
            'opened_at' => Carbon::now(),
        ]);
    }

    public function closeRegister(CashRegister $register, float $countedCash, array $denominations, ?string $notes = null): CashRegister
    {
        $expectedCash = $this->calculateExpectedCash($register);
        $difference = $countedCash - $expectedCash;

        $updatedRegister = $this->repository->update($register->id, [
            'expected_cash' => $expectedCash,
            'counted_cash' => $countedCash,
            'difference' => $difference,
            'status' => 'closed',
            'closed_at' => Carbon::now(),
            'notes' => $notes,
        ]);

        $this->repository->addDenominations($register->id, $denominations);

        return $updatedRegister;
    }

    public function calculateExpectedCash(CashRegister $register): float
    {
        $cashSales = Sale::where('user_id', $register->user_id)
            ->where('status', 'Completed')
            ->where('payment_method', 'Cash')
            ->where('created_at', '>=', $register->opened_at)
            ->sum('paid_amount');

        return (float) $register->opening_balance + (float) $cashSales;
    }

    public function getActiveRegister(int $userId): ?CashRegister
    {
        $register = $this->repository->getActiveRegister($userId);
        if ($register) {
            $register->expected_cash = $this->calculateExpectedCash($register);
        }
        return $register;
    }
}
