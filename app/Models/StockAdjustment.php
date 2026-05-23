<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockAdjustment extends Model
{
    use HasFactory, SoftDeletes;

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

    public function medicine(): BelongsTo
    {
        return $this->belongsTo(Medicine::class);
    }

    public function stockBatch(): BelongsTo
    {
        return $this->belongsTo(StockBatch::class);
    }
}
