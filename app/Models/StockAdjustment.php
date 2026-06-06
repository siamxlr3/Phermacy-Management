<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockAdjustment extends Model
{
    use HasFactory, SoftDeletes;
    
    // Adjustment Types
    public const TYPE_DAMAGE = 'damage';
    public const TYPE_EXPIRED = 'expired';
    public const TYPE_OPENING_BALANCE = 'opening_balance';
    public const TYPE_CORRECTION = 'correction';
    public const TYPE_THEFT = 'theft';
    public const TYPE_LOST = 'lost';

    // Adjustment Units
    public const UNIT_PIECE = 'piece';
    public const UNIT_STRIP = 'strip';
    public const UNIT_BOX = 'box';
    public const UNIT_BOTTLE = 'bottle';
    public const UNIT_TUBE = 'tube';
    public const UNIT_VIAL = 'vial';
    public const UNIT_INHALER = 'inhaler';
    public const UNIT_PACK = 'pack';

    protected $fillable = [
        'medicine_id',
        'stock_batch_id',
        'adjustment_type',
        'adjustment_unit',
        'qty_in_units',
        'qty_change_tablets',
        'qty_before',
        'qty_after',
        'note',
    ];

    protected $casts = [
        'qty_in_units' => 'integer',
        'qty_change_tablets' => 'integer',
        'qty_before' => 'integer',
        'qty_after' => 'integer',
    ];

    /**
     * Get valid adjustment types.
     */
    public static function getAdjustmentTypes(): array
    {
        return [
            self::TYPE_DAMAGE,
            self::TYPE_EXPIRED,
            self::TYPE_OPENING_BALANCE,
            self::TYPE_CORRECTION,
            self::TYPE_THEFT,
            self::TYPE_LOST,
        ];
    }

    /**
     * Get valid adjustment units.
     */
    public static function getAdjustmentUnits(): array
    {
        return [
            self::UNIT_PIECE,
            self::UNIT_STRIP,
            self::UNIT_BOX,
            self::UNIT_BOTTLE,
            self::UNIT_TUBE,
            self::UNIT_VIAL,
            self::UNIT_INHALER,
            self::UNIT_PACK,
        ];
    }

    public function medicine(): BelongsTo
    {
        return $this->belongsTo(Medicine::class);
    }

    public function stockBatch(): BelongsTo
    {
        return $this->belongsTo(StockBatch::class);
    }

    /**
     * Calculate tablet equivalent based on unit and medicine configuration.
     */
    public static function calculateTablets(Medicine $medicine, string $unit, int $qty): int
    {
        return match (strtolower($unit)) {
            self::UNIT_PIECE => $qty,
            self::UNIT_STRIP => $qty * ($medicine->tablets_per_strip ?? 1),
            self::UNIT_BOX => $qty * ($medicine->strips_per_box ?? 1) * ($medicine->tablets_per_strip ?? 1),
            default => $qty,
        };
    }

    /**
     * reverse the stock impact of this adjustment.
     */
    public function reverseStockImpact(): void
    {
        \Illuminate\Support\Facades\DB::transaction(function () {
            $batch = StockBatch::lockForUpdate()->findOrFail($this->stock_batch_id);
            $medicine = Medicine::lockForUpdate()->findOrFail($this->medicine_id);

            $isAddition = ($this->adjustment_type === self::TYPE_OPENING_BALANCE);
            $qtyChangeTablets = $this->qty_change_tablets;

            // Update Remaining Quantities
            if ($isAddition) {
                $batch->qty_tablets_remaining -= $qtyChangeTablets;
                if ($batch->qty_units_remaining !== null) {
                    $batch->qty_units_remaining -= $qtyChangeTablets;
                }
                $medicine->decrement('stock', $qtyChangeTablets);
            } else {
                $batch->qty_tablets_remaining += $qtyChangeTablets;
                if ($batch->qty_units_remaining !== null) {
                    $batch->qty_units_remaining += $qtyChangeTablets;
                }
                $medicine->increment('stock', $qtyChangeTablets);
            }

            // Reverse Original Quantities ONLY for opening_balance additions.
            // For reductions, qty_tablets / qty_boxes were never changed, so nothing to reverse.
            if ($isAddition) {
                $batch->qty_tablets -= $qtyChangeTablets;
                if ($batch->qty_units !== null) {
                    $batch->qty_units -= $qtyChangeTablets;
                }
                if ($batch->qty_boxes !== null) {
                    $tabletsPerBoxCalc = ($batch->qty_boxes > 0)
                        ? ((float) $batch->qty_tablets_remaining / (float) $batch->qty_boxes_remaining)
                        : 1;
                    $batch->qty_boxes = round((float) $batch->qty_tablets / max($tabletsPerBoxCalc, 1), 4);
                }
            }

            // Restore qty_adjusted (valuation tracker for Inventory Reports)
            $deltaValuation = $isAddition ? $qtyChangeTablets : -$qtyChangeTablets;
            $batch->qty_adjusted -= $deltaValuation;

            // Recalculate remaining boxes using the original batch ratio (qty_tablets / qty_boxes)
            $tabletsPerBox = ($batch->qty_boxes > 0 && $batch->qty_tablets > 0)
                ? ((float) $batch->qty_tablets / (float) $batch->qty_boxes)
                : 1;

            if ($batch->qty_boxes_remaining !== null && $tabletsPerBox > 0) {
                $batch->qty_boxes_remaining = round((float) $batch->qty_tablets_remaining / $tabletsPerBox, 4);
            }

            $batch->save();
        });
    }
}
