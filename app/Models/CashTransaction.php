<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Exception;

/**
 * @property int $id
 * @property string|null $description
 * @property float $amount
 * @property string $transaction_type  In|Out|sale_refund|expense|grn_payment
 * @property float $balance_after
 * @property string|null $reference_type
 * @property int|null $reference_id
 * @property string|null $reference_number
 * @property string $payment_method
 * @property string|null $party_name
 * @property string $party_type
 */
class CashTransaction extends Model
{
    use HasFactory;

    // Transaction Types
    public const TYPE_IN           = 'In';
    public const TYPE_OUT          = 'Out';
    public const TYPE_SALE_REFUND  = 'sale_refund';
    public const TYPE_EXPENSE      = 'expense';
    public const TYPE_GRN_PAYMENT  = 'grn_payment';
    public const TYPE_GRN_REVERSAL = 'grn_reversal';
    public const TYPE_EXPENSE_REVERSAL = 'expense_reversal';

    // Grouping Types
    public const TYPES_OUTFLOW = [
        self::TYPE_OUT,
        self::TYPE_SALE_REFUND,
        self::TYPE_EXPENSE,
        self::TYPE_GRN_PAYMENT
    ];

    // Party Types
    public const PARTY_CUSTOMER = 'customer';
    public const PARTY_SUPPLIER = 'supplier';
    public const PARTY_OTHER    = 'other';

    protected $fillable = [
        'user_id',
        'description',
        'amount',
        'transaction_type',
        'balance_after',
        'reference_type',
        'reference_id',
        'reference_number',
        'payment_method',
        'party_name',
        'party_type',
    ];

    protected $casts = [
        'user_id'       => 'integer',
        'amount'        => 'decimal:2',
        'balance_after' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scopeInflow($query)
    {
        return $query->where('transaction_type', self::TYPE_IN);
    }

    public function scopeOutflow($query)
    {
        return $query->whereIn('transaction_type', self::TYPES_OUTFLOW);
    }

    protected static function boot()
    {
        parent::boot();

        static::updating(function ($transaction) {
            throw new Exception("Cash transactions are strictly append-only and cannot be modified.");
        });

        static::deleting(function ($transaction) {
            throw new Exception("Cash transactions are strictly append-only and cannot be deleted.");
        });
    }

    /**
     * Get current running balance safely.
     */
    public static function getCurrentBalance(): float
    {
        $last = self::latest('id')->first();
        return $last ? (float) $last->balance_after : 0.0;
    }

    /**
     * Record a new transaction atomically under high concurrency.
     */
    public static function record(
        string  $transactionType,
        float   $amount,
        ?string $description = null,
        ?string $referenceType = null,
        ?int    $referenceId = null,
        ?string $referenceNumber = null,
        string  $paymentMethod = 'cash',
        ?string $partyName = null,
        string  $partyType = 'other',
        ?int    $userId = null
    ): self {
        return DB::transaction(function () use (
            $transactionType, $amount, $description,
            $referenceType, $referenceId, $referenceNumber,
            $paymentMethod, $partyName, $partyType, $userId
        ) {
            $last = self::lockForUpdate()->latest('id')->first();
            $currentBalance = $last ? (float) $last->balance_after : 0.0;

            $isOut = in_array($transactionType, self::TYPES_OUTFLOW);
            $newBalance = $isOut
                ? $currentBalance - $amount
                : $currentBalance + $amount;

            return self::create([
                'user_id'          => $userId,
                'transaction_type' => $transactionType,
                'amount'           => $amount,
                'description'      => $description,
                'balance_after'    => $newBalance,
                'reference_type'   => $referenceType,
                'reference_id'     => $referenceId,
                'reference_number' => $referenceNumber,
                'payment_method'   => $paymentMethod,
                'party_name'       => $partyName,
                'party_type'       => $partyType,
            ]);
        });
    }
}
