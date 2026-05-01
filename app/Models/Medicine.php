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
        'category_name',
        'manufacturer_name',
        'dosage_form',
        'strength',
        'tablet_per_stripe',
        'stripe_per_box',
        'price_per_tablet',
        'price_per_stripe',
        'price_per_box',
        'volume',
        'price',
        'reorder_level',
        'status',
        'stock',
    ];

    protected $casts = [
        'tablet_per_stripe' => 'integer',
        'stripe_per_box' => 'integer',
        'price_per_tablet' => 'decimal:2',
        'price_per_stripe' => 'decimal:2',
        'price_per_box' => 'decimal:2',
        'price' => 'decimal:2',
        'reorder_level' => 'integer',
        'stock' => 'integer',
    ];

    // Removed category() and manufacturer() relationships as they are now plain strings
    
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
