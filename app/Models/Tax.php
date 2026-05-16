<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Cache;

/**
 * @property int $id
 * @property string $name
 * @property float $rate
 * @property string $status
 */
class Tax extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['name', 'rate', 'status'];

    protected $casts = [
        'rate' => 'decimal:4',
    ];

    /**
     * Scope a query to only include active taxes.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'Active');
    }

    protected static function booted()
    {
        $clearCache = fn () => \Illuminate\Support\Facades\Cache::forget('taxes.active_list');

        static::saved($clearCache);
        static::deleted($clearCache);
        static::restored($clearCache);
    }
}
