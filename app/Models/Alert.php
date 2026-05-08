<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int|null $medicine_id
 * @property int|null $stock_batch_id
 * @property string $type
 * @property string $severity
 * @property string $message
 * @property string $status
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class Alert extends Model
{
    use HasFactory;

    public const STATUS_ACTIVE = 'Active';
    public const STATUS_DISMISSED = 'Dismissed';

    protected $fillable = [
        'medicine_id',
        'stock_batch_id',
        'type',
        'severity',
        'message',
        'status',
    ];

    public function medicine()
    {
        return $this->belongsTo(Medicine::class);
    }

    public function stockBatch()
    {
        return $this->belongsTo(StockBatch::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }
}
