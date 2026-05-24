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
        'cost_price', // Added for COGS
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'cost_price' => 'decimal:4',
        'qty_tablets' => 'integer',
        'sale_qty' => 'decimal:2',
    ];

    protected static function booted()
    {
        static::creating(function ($item) {
            if ($item->stock_batch_id) {
                $item->cost_price = $item->batch->cost_per_unit;
            }
        });
    }

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

    /**
     * Get top categories by revenue.
     */
    public static function getTopCategories($start, $end)
    {
        return self::join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('medicines', 'sale_items.medicine_id', '=', 'medicines.id')
            ->whereIn('sales.status', [Sale::STATUS_COMPLETED, Sale::STATUS_PARTIALLY_RETURNED])
            ->whereBetween('sales.sale_date', [$start, $end])
            ->selectRaw('medicines.category as category_name, SUM(sale_items.subtotal) as total_revenue, COUNT(sale_items.id) as total_items')
            ->groupBy('medicines.category')
            ->orderByDesc('total_revenue')
            ->get();
    }
}
