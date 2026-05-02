<?php

namespace App\Repositories;

use App\Models\CashRegister;
use App\Models\CashDenomination;
use Carbon\Carbon;

class CashRegisterRepository
{
    public function getActiveRegister(int $userId): ?CashRegister
    {
        return CashRegister::where('user_id', $userId)
            ->where('status', 'open')
            ->first();
    }

    public function create(array $data): CashRegister
    {
        return CashRegister::create($data);
    }

    public function update(int $id, array $data): CashRegister
    {
        $register = CashRegister::findOrFail($id);
        $register->update($data);
        return $register;
    }

    public function addDenominations(int $registerId, array $denominations): void
    {
        foreach ($denominations as $item) {
            CashDenomination::create([
                'cash_register_id' => $registerId,
                'denomination' => $item['denomination'],
                'quantity' => $item['quantity'],
                'subtotal' => $item['denomination'] * $item['quantity'],
            ]);
        }
    }
}
