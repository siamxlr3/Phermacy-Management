<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property int $medicine_id
 * @property int $supplier_id
 * @property int|null $grn_id
 * @property string $batch_number
 * @property \Illuminate\Support\Carbon $expiry_date
 * @property int $qty_tablets
 * @property int $qty_tablets_remaining
 * @property float|null $cost_per_tablet
 * @property float|null $cost_per_stripe
 * @property float|null $cost_per_box
 * @property string|null $volume
 * @property float|null $price
 * @property \Illuminate\Support\Carbon $received_date
 */
class StockBatch extends Model
{
    use HasFactory, SoftDeletes;

    protected static function booted()
    {
        static::creating(function ($batch) {
            if ($batch->medicine_id && !$batch->dosage_form_snapshot) {
                $batch->dosage_form_snapshot = $batch->medicine->dosage_form;
            }
        });

        static::saving(function ($batch) {
            $batch->calculateValuation();
        });

        static::saved(fn () => Cache::tags(['stock', 'reports'])->flush());
        static::deleted(fn () => Cache::tags(['stock', 'reports'])->flush());
    }

    /**
     * Calculate and store the total valuation of this batch at cost.
     */
    public function calculateValuation(): void
    {
        $medicine = $this->medicine;
        if (!$medicine) return;

        $qty = $this->qty_tablets_remaining;

        if (in_array($medicine->dosage_form, ["Tablet", "Capsule", "Suppository", "Patch"])) {
            $tabletsPerBox = ($medicine->tablets_per_strip ?? 1) * ($medicine->strips_per_box ?? 1);
            $this->total_cost_value = ($qty / ($tabletsPerBox ?: 1)) * ($this->cost_per_box ?? 0);
        } else {
            // For liquid/inhaler/other types, prefer cost_per_box, fall back to cost_per_unit
            $unitCost = ($this->cost_per_unit && $this->cost_per_unit > 0)
                ? $this->cost_per_unit
                : ($this->cost_per_box ?? $medicine->cost_price ?? 0);
            $this->total_cost_value = $qty * $unitCost;
        }
    }

    protected $fillable = [
        'medicine_id',
        'supplier_id',
        'grn_id',
        'dosage_form_snapshot',
        'batch_number',
        'expiry_date',
        'qty_tablets',
        'qty_tablets_remaining',
        'qty_boxes',
        'qty_boxes_remaining',
        'qty_units',
        'qty_units_remaining',
        'cost_per_unit',
        'cost_per_stripe',
        'cost_per_box',
        'received_date',
        'total_cost_value', // Denormalized value
    ];

    protected $casts = [
        'expiry_date' => 'date',
        'received_date' => 'date',
        'cost_per_unit' => 'decimal:4',
        'cost_per_stripe' => 'decimal:4',
        'cost_per_box' => 'decimal:4',
        'total_cost_value' => 'decimal:2',
    ];

    public function medicine()
    {
        return $this->belongsTo(Medicine::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function grn()
    {
        return $this->belongsTo(GRN::class);
    }

    /**
     * Scope a query to only include batches with remaining stock.
     */
    public function scopeAvailable($query)
    {
        return $query->where('qty_tablets_remaining', '>', 0);
    }

    /**
     * Scope a query to only include expiring or soon-to-expire stock.
     */
    public function scopeExpiringSoon($query, $days = 90)
    {
        return $query->whereBetween('expiry_date', [
            now()->toDateString(),
            now()->addDays($days)->toDateString()
        ]);
    }
}
