<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GRN extends Model
{
    use HasFactory;

    protected $table = 'grns';

    protected $fillable = [
        'purchase_order_id',
        'received_date',
        'invoice_number',
        'received_by',
        'total_amount',
        'notes',
    ];

    protected $casts = [
        'received_date' => 'date',
        'total_amount' => 'decimal:2',
    ];

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function items()
    {
        return $this->hasMany(GRNItem::class, 'grn_id');
    }
}
