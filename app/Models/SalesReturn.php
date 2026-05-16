<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesReturn extends Model
{
    use HasFactory;

    protected $fillable = [
        'sale_id',
        'user_id',
        'return_invoice_number',
        'return_date',
        'subtotal_returned',
        'tax_returned',
        'total_returned',
        'reason',
        'refund_method',
        'original_payment_method',
        'return_type',
        'cash_transaction_id',
    ];

    protected $casts = [
        'sale_id' => 'integer',
        'user_id' => 'integer',
        'return_date' => 'datetime',
        'subtotal_returned' => 'decimal:2',
        'tax_returned' => 'decimal:2',
        'total_returned' => 'decimal:2',
        'cash_transaction_id' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    public function items()
    {
        return $this->hasMany(SalesReturnItem::class);
    }

    public function cashTransaction()
    {
        return $this->belongsTo(CashTransaction::class);
    }
}
