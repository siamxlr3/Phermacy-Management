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
}
