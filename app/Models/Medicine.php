<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Cache;

/**
 * @property int $id
 * @property string $name
 * @property string|null $generic_name
 * @property string $category_name
 * @property string $manufacturer_name
 * @property string $dosage_form
 * @property string|null $strength
 * @property int|null $tablet_per_stripe
 * @property int|null $stripe_per_box
 * @property float|null $price_per_tablet
 * @property float|null $price_per_stripe
 * @property float|null $price_per_box
 * @property string|null $volume
 * @property float|null $price
 * @property float|null $cost_price
 * @property int $reorder_level
 * @property int $stock
 * @property string $status
 */
class Medicine extends Model
{
    use HasFactory, SoftDeletes;

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
        'cost_price', // FIX: was missing, causing silent update failures in PO flow
        'reorder_level',
        'status',
        'stock',
    ];

    protected $casts = [
        'tablet_per_stripe' => 'integer',
        'stripe_per_box' => 'integer',
        'price_per_tablet' => 'decimal:4',
        'price_per_stripe' => 'decimal:2',
        'price_per_box' => 'decimal:2',
        'price' => 'decimal:2',
        'cost_price' => 'decimal:4',
        'reorder_level' => 'integer',
        'stock' => 'integer',
    ];

    protected static function booted(): void
    {
        // Auto-clear dropdown cache when a medicine is modified
        static::saved(fn() => Cache::forget('medicines.active_list'));
        static::deleted(fn() => Cache::forget('medicines.active_list'));
    }

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
