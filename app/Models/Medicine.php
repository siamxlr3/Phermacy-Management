<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Medicine extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'generic_name',
        'category_id',
        'manufacturer_id',
        'tablets_per_strip',
        'strips_per_box',
        'sale_unit',
        'price_per_tablet',
        'cost_price',
        'reorder_level',
        'status',
        'stock',
    ];

    protected $casts = [
        'price_per_tablet' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'tablets_per_strip' => 'integer',
        'strips_per_box' => 'integer',
        'reorder_level' => 'integer',
        'stock' => 'integer',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function manufacturer()
    {
        return $this->belongsTo(Manufacturer::class);
    }

    public function stockBatches()
    {
        return $this->hasMany(StockBatch::class);
    }

    public function stockAdjustments()
    {
        return $this->hasMany(StockAdjustment::class);
    }

    public function saleItems()
    {
        return $this->hasMany(SaleItem::class);
    }
}
