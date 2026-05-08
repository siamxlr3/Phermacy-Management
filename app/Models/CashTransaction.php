<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Exception;

/**
 * @property int $id
 * @property string|null $items
 * @property float $amount
 * @property string $type
 * @property float $balance_after
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class CashTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'items',
        'amount',
        'type',
        'balance_after',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'balance_after' => 'decimal:2',
    ];

    protected static function boot()
    {
        parent::boot();

        // Enforce Immutable Append-Only Ledger
        static::updating(function ($transaction) {
            throw new Exception("Cash transactions are strictly append-only and cannot be modified.");
        });

        static::deleting(function ($transaction) {
            throw new Exception("Cash transactions are strictly append-only and cannot be deleted.");
        });
    }

    /**
     * Static helper to get the latest running balance safely.
     */
    public static function getCurrentBalance(): float
    {
        $last = self::latest('id')->first();
        return $last ? (float) $last->balance_after : 0.0;
    }

    /**
     * Static helper to record a new transaction safely under high concurrency.
     */
    public static function record(string $type, float $amount, ?string $items = null): self
    {
        return DB::transaction(function () use ($type, $amount, $items) {
            // FIX: Atomic lock on the ledger table to prevent race conditions during high concurrency
            $last = self::lockForUpdate()->latest('id')->first();
            $currentBalance = $last ? (float) $last->balance_after : 0.0;
            
            $newBalance = ($type === 'In') 
                ? $currentBalance + $amount 
                : $currentBalance - $amount;

            return self::create([
                'type' => $type,
                'amount' => $amount,
                'items' => $items,
                'balance_after' => $newBalance,
            ]);
        });
    }
}
