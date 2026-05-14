<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesReturnItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'sales_return_id',
        'sale_item_id',
        'medicine_id',
        'stock_batch_id',
        'qty_returned',
        'sale_unit',
        'unit_price',
        'subtotal',
        'return_condition',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'subtotal'   => 'decimal:2',
        'qty_returned' => 'integer',
    ];

    public function return()
    {
        return $this->belongsTo(SalesReturn::class, 'sales_return_id');
    }

    public function saleItem()
    {
        return $this->belongsTo(SaleItem::class);
    }

    public function medicine()
    {
        return $this->belongsTo(Medicine::class);
    }

    public function batch()
    {
        return $this->belongsTo(StockBatch::class, 'stock_batch_id');
    }
}
