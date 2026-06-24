<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Cache;

/**
 * @property int $id
 * @property string $medicine_name
 * @property string|null $generic_name
 * @property int|null $category_id
 * @property int|null $manufacturer_id
 * @property string $dosage_form
 * @property string|null $strength
 * @property string $unit_type
 * @property string $sale_unit_label
 * @property int|null $tablets_per_strip
 * @property int|null $strips_per_box
 * @property string|null $package_size
 * @property float $price_per_unit
 * @property float|null $price_per_stripe
 * @property float|null $price_per_box
 * @property float $mrp
 * @property int $reorder_level
 * @property int $stock
 * @property bool $is_active
 * @property \Illuminate\Support\Carbon|null $last_sold_at
 */
class Medicine extends Model
{
    use HasFactory, SoftDeletes;

    public const DOSAGE_FORMS = [
        'Tablet', 'Capsule', 'Syrup', 'Drops', 'Cream', 'Ointment', 
        'Gel', 'Lotion', 'Suspension', 'Injection', 'Inhaler', 
        'Powder', 'Suppository', 'Patch', 'Sachet'
    ];

    protected $fillable = [
        'medicine_name',
        'generic_name',
        'category_id',
        'manufacturer_id',
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
        'reorder_level',
        'stock',
        'last_sold_at',
        'is_active',
    ];

    protected $casts = [
        'tablets_per_strip' => 'integer',
        'strips_per_box' => 'integer',
        'price_per_unit' => 'decimal:2',
        'price_per_stripe' => 'decimal:2',
        'price_per_box' => 'decimal:2',
        'mrp' => 'decimal:2',
        'reorder_level' => 'integer',
        'stock' => 'integer',
        'last_sold_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    protected static function booted(): void
    {
        $clearCache = fn() => Cache::forget('medicines.active_with_details');

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

    /**
     * Scope for slow moving items (not sold in X days).
     */
    public function scopeSlowMoving($query, $days = 90)
    {
        return $query->where('stock', '>', 0)
            ->where(function($q) use ($days) {
                $q->whereNull('last_sold_at')
                  ->orWhere('last_sold_at', '<', now()->subDays($days));
            });
    }

    // Relationships
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

    /**
     * Convert a quantity from a specific sale unit to the base unit (tablets).
     */
    public function convertToTablets(float $quantity, string $unit): int
    {
        if ($unit === 'Box') {
            $tabletsPerBox = (int) (($this->tablets_per_strip ?? 0) * ($this->strips_per_box ?? 0));
            if ($tabletsPerBox <= 0) {
                return (int) round($quantity); // Fallback to 1:1 if factors are missing
            }
            return (int) round($quantity * $tabletsPerBox);
        }

        if ($unit === 'Strip') {
            $tabletsPerStrip = (int) ($this->tablets_per_strip ?? 0);
            if ($tabletsPerStrip <= 0) {
                return (int) round($quantity);
            }
            return (int) round($quantity * $tabletsPerStrip);
        }

        return (int) round($quantity);
    }

    /**
     * Convert a quantity from the base unit (tablets) back to a display unit.
     */
    public function convertFromTablets(int $tablets, string $unit): float
    {
        if ($unit === 'Box') {
            $tabletsPerBox = (int) (($this->tablets_per_strip ?? 0) * ($this->strips_per_box ?? 0));
            return $tabletsPerBox > 0 ? $tablets / $tabletsPerBox : (float) $tablets;
        }

        if ($unit === 'Strip') {
            $tabletsPerStrip = (int) ($this->tablets_per_strip ?? 0);
            return $tabletsPerStrip > 0 ? $tablets / $tabletsPerStrip : (float) $tablets;
        }

        return (float) $tablets;
    }

    /**
     * Check if the medicine has any associated stock or sales.
     */
    public function hasDependencies(): bool
    {
        return $this->stockBatches()->exists() || 
               $this->saleItems()->exists() || 
               $this->stockAdjustments()->exists();
    }

    /**
     * Get low stock medicines.
     */
    public static function getLowStockAlerts()
    {
        return self::active()
            ->whereColumn('stock', '<=', 'reorder_level')
            ->select('id', 'medicine_name', 'stock as qty', 'reorder_level')
            ->orderBy('stock', 'asc')
            ->get();
    }

    /**
     * Check if the medicine has any available but expired stock.
     */
    public function getHasExpiredStockAttribute(): bool
    {
        return $this->stockBatches()
            ->available()
            ->where('expiry_date', '<=', now()->toDateString())
            ->exists();
    }
}
