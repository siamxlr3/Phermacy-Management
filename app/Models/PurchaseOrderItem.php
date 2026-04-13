<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseOrderItem extends Model
{
    use HasFactory;
    
    protected static function booted()
    {
        static::saved(function ($item) {
            $item->purchaseOrder->syncTotal();
        });

        static::deleted(function ($item) {
            $item->purchaseOrder->syncTotal();
        });
    }

    protected $fillable = [
        'purchase_order_id',
        'medicine_id',
        'qty_boxes',
        'unit_cost',
        'subtotal',
    ];

    protected $casts = [
        'qty_boxes' => 'integer',
        'unit_cost' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function medicine()
    {
        return $this->belongsTo(Medicine::class);
    }
}
