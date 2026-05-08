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

    protected static function booted()
    {
        static::saved(fn () => Cache::forget('taxes.active_list'));
        static::deleted(fn () => Cache::forget('taxes.active_list'));
    }
}
