<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SaleItem extends Model
{
    use HasFactory;

    protected static function booted()
    {
        static::saved(function ($item) {
            if ($item->sale) {
                $item->sale->syncTotal();
            }
        });

        static::deleted(function ($item) {
            if ($item->sale) {
                $item->sale->syncTotal();
            }
        });
    }

    protected $fillable = [
        'sale_id',
        'medicine_id',
        'sale_unit',
        'stock_batch_id',
        'qty_tablets',
        'unit_price',
        'tax_amount',
        'subtotal',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'qty_tablets' => 'integer',
    ];

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    public function medicine()
    {
        return $this->belongsTo(Medicine::class);
    }

    public function batch()
    {
        return $this->belongsTo(StockBatch::class, 'stock_batch_id');
    }

    public function returnItems()
    {
        return $this->hasMany(SalesReturnItem::class);
    }
}
