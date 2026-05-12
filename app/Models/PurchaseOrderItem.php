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
        'dosage_form_snapshot',
        'qty_boxes',
        'cost_per_box',
        'cost_per_stripe',
        'cost_per_unit',
        'subtotal',
    ];

    protected $casts = [
        'qty_boxes' => 'integer',
        'cost_per_box' => 'decimal:4',
        'cost_per_stripe' => 'decimal:4',
        'cost_per_unit' => 'decimal:4',
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
