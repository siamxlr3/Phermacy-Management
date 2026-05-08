<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property int $sale_id
 * @property int $medicine_id
 * @property int $stock_batch_id
 * @property string|null $sale_unit
 * @property float|null $sale_qty
 * @property int $qty_tablets
 * @property float $unit_price
 * @property float $tax_amount
 * @property float $subtotal
 */
class SaleItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'sale_id',
        'medicine_id',
        'sale_unit',
        'sale_qty',
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
        'sale_qty' => 'decimal:2',
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
