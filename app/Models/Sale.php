<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'invoice_number',
        'sale_date',
        'subtotal',
        'tax_total',
        'discount_total',
        'grand_total',
        'payment_method',
        'status',
        'notes',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'sale_date' => 'datetime',
        'subtotal' => 'decimal:2',
        'tax_total' => 'decimal:2',
        'discount_total' => 'decimal:2',
        'grand_total' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }

    public function returns()
    {
        return $this->hasMany(SalesReturn::class);
    }

    /**
     * Recalculate and save the totals based on items
     */
    public function syncTotal(): void
    {
        $this->subtotal = $this->items()->sum('subtotal');
        $this->tax_total = $this->items()->sum('tax_amount');
        $this->grand_total = ($this->subtotal + $this->tax_total) - $this->discount_total;
        $this->save();
    }
}
