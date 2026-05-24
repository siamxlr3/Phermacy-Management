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

    public const TYPE_LOW_STOCK = 'Low Stock';
    public const TYPE_EXPIRY = 'Expiry';

    public const SEVERITY_INFO = 'Info';
    public const SEVERITY_WARNING = 'Warning';
    public const SEVERITY_CRITICAL = 'Critical';

    protected $fillable = [
        'medicine_id',
        'stock_batch_id',
        'type',
        'severity',
        'message',
        'status',
    ];

    protected $casts = [
        'medicine_id' => 'integer',
        'stock_batch_id' => 'integer',
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

    public function scopeTypeExpiry($query)
    {
        return $query->where('type', 'Expiry');
    }

    public function scopeTypeLowStock($query)
    {
        return $query->where('type', 'Low Stock');
    }
}
