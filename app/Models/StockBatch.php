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
 * @property string $dosage_form_snapshot
 * @property string $batch_number
 * @property \Illuminate\Support\Carbon $expiry_date
 * @property int $qty_tablets
 * @property int $qty_tablets_remaining
 * @property int $qty_boxes
 * @property int $qty_boxes_remaining
 * @property int|null $qty_units
 * @property int|null $qty_units_remaining
 * @property float|null $cost_per_unit
 * @property float|null $cost_per_stripe
 * @property float|null $cost_per_box
 * @property float $total_cost_value
 * @property float $ingested_total_cost_value
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

        static::saved(fn () => Cache::tags(['stock'])->flush());
        static::deleted(fn () => Cache::tags(['stock'])->flush());
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
        $ingestedCost = 0;

        // 1. Current Valuation (based on remaining stock)
        if ($this->cost_per_box > 0) {
            if ($this->qty_boxes_remaining !== null) {
                $totalCost = (float) $this->qty_boxes_remaining * (float) $this->cost_per_box;
            }
        } elseif ($this->cost_per_unit > 0) {
            $totalCost = (float) $this->qty_tablets_remaining * (float) $this->cost_per_unit;
        } else {
            $totalCost = (float) $this->qty_tablets_remaining * (float) ($medicine->cost_price ?? 0);
        }

        // 2. Ingested Valuation (ignores sales, but includes adjustments)
        // Formula: (Original Qty + Total Adjusted Qty) * Purchase Price
        $effectiveQty = (float) $this->qty_tablets + (float) ($this->qty_adjusted ?? 0);
        
        if ($this->cost_per_box > 0) {
            // Derive adjusted box count
            $tabletsPerBox = ($this->qty_boxes > 0) ? ($this->qty_tablets / $this->qty_boxes) : 0;
            $effectiveBoxes = ($tabletsPerBox > 0) ? ($effectiveQty / $tabletsPerBox) : 0;
            $ingestedCost = (float) $effectiveBoxes * (float) $this->cost_per_box;
        } elseif ($this->cost_per_unit > 0) {
            $ingestedCost = (float) $effectiveQty * (float) $this->cost_per_unit;
        } else {
            $costPrice = (float) ($medicine->cost_price ?? 0);
            $ingestedCost = (float) $effectiveQty * $costPrice;
        }

        $this->total_cost_value = round($totalCost, 2);
        $this->ingested_total_cost_value = round($ingestedCost, 2);
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
        'ingested_total_cost_value', // Cumulative valuation (ignores sales, reflects adjustments)
        'qty_adjusted',
    ];

    protected $casts = [
        'expiry_date' => 'date',
        'received_date' => 'date',
        'cost_per_unit' => 'decimal:4',
        'cost_per_stripe' => 'decimal:4',
        'cost_per_box' => 'decimal:4',
        'total_cost_value' => 'decimal:2',
        'ingested_total_cost_value' => 'decimal:2',
        'qty_adjusted' => 'integer',
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
        return $query->where('expiry_date', '<=', now()->addDays($days)->toDateString());
    }
}
