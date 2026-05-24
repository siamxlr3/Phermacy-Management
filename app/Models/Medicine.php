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
        'medicine_name',
        'generic_name',
        'category',
        'manufacturer',
        'dosage_form',
        'strength',
        'unit_type',
        'sale_unit_label',
        'tablets_per_strip',
        'strips_per_box',
        'package_size',
        'price_per_unit',
        'price_per_stripe',
        'price_per_box',
        'mrp',
        'cost_price',
        'reorder_level',
        'stock',
        'is_active',
    ];

    protected $casts = [
        'tablets_per_strip' => 'integer',
        'strips_per_box' => 'integer',
        'price_per_unit' => 'decimal:2',
        'price_per_stripe' => 'decimal:2',
        'price_per_box' => 'decimal:2',
        'mrp' => 'decimal:2',
        'cost_price' => 'decimal:4',
        'reorder_level' => 'integer',
        'stock' => 'integer',
        'is_active' => 'boolean',
    ];

    protected static function booted(): void
    {
        $clearCache = fn() => Cache::forget('medicines.active_list');

        static::saved($clearCache);
        static::deleted($clearCache);
        static::restored($clearCache);
    }

    /**
     * Scope a query to only include active medicines.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
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

    /**
     * Convert a quantity from a specific sale unit to the base unit (tablets).
     */
    public function convertToTablets(float $quantity, string $unit): int
    {
        if ($unit === 'Box') {
            $tabletsPerBox = (int) (($this->tablets_per_strip ?? 1) * ($this->strips_per_box ?? 1));
            return (int) round($quantity * ($tabletsPerBox > 0 ? $tabletsPerBox : 1));
        } 
        
        if ($unit === 'Strip') {
            $tabletsPerStrip = (int) ($this->tablets_per_strip ?? 1);
            return (int) round($quantity * ($tabletsPerStrip > 0 ? $tabletsPerStrip : 1));
        }

        return (int) round($quantity);
    }

    /**
     * Convert a quantity from the base unit (tablets) back to a display unit.
     */
    public function convertFromTablets(int $tablets, string $unit): float
    {
        if ($unit === 'Box') {
            $tabletsPerBox = (int) (($this->tablets_per_strip ?? 1) * ($this->strips_per_box ?? 1));
            return $tablets / ($tabletsPerBox > 0 ? $tabletsPerBox : 1);
        }

        if ($unit === 'Strip') {
            $tabletsPerStrip = (int) ($this->tablets_per_strip ?? 1);
            return $tablets / ($tabletsPerStrip > 0 ? $tabletsPerStrip : 1);
        }

        return (float) $tablets;
    }
}
