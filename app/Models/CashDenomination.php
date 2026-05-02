<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CashDenomination extends Model
{
    use HasFactory;

    protected $fillable = [
        'cash_register_id',
        'denomination',
        'quantity',
        'subtotal',
    ];

    protected $casts = [
        'denomination' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    public function register()
    {
        return $this->belongsTo(CashRegister::class, 'cash_register_id');
    }
}
