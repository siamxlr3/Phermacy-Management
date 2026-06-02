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

        static::saved(fn () => Cache::flush());
        static::deleted(fn () => Cache::flush());
    }

    /**
     * Calculate and store the total valuation of this batch at cost.
     * Uses qty_boxes_remaining * cost_per_box to stay consistent with
     * the GRN controller formula and avoid floating-point drift from
     * fractional-box division after partial sales.
     */
    public function calculateValuation(): void
    {
        $medicine = $this->medicine;
        if (!$medicine) return;

        $totalCost = 0;

        if ($this->cost_per_box > 0 && $this->qty_boxes_remaining !== null) {
            // Primary: boxes remaining × cost per box (matches GRN controller exactly)
            $totalCost = (float) $this->qty_boxes_remaining * (float) $this->cost_per_box;
        } elseif ($this->cost_per_unit > 0) {
            // Fallback: tablets remaining × cost per unit
            $totalCost = (float) $this->qty_tablets_remaining * (float) $this->cost_per_unit;
        } else {
            // Last resort: use medicine cost_price
            $totalCost = (float) $this->qty_tablets_remaining * (float) ($medicine->cost_price ?? 0);
        }

        $this->total_cost_value = round($totalCost, 2);
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
