<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesReturn extends Model
{
    use HasFactory;

    protected $fillable = [
        'sale_id',
        'return_invoice_number',
        'return_date',
        'subtotal_returned',
        'tax_returned',
        'total_returned',
        'reason',
    ];

    protected $casts = [
        'return_date' => 'datetime',
        'subtotal_returned' => 'decimal:2',
        'tax_returned' => 'decimal:2',
        'total_returned' => 'decimal:2',
    ];

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    public function items()
    {
        return $this->hasMany(SalesReturnItem::class);
    }
}
