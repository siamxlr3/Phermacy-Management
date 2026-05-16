<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Cache;

class Address extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'phone',
        'email',
        'address',
        'google_maps_embed',
        'status'
    ];

    /**
     * Scope a query to only include active addresses.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'Active');
    }

    protected static function booted()
    {
        $clearCache = fn () => Cache::forget('addresses.active_list');

        static::saved($clearCache);
        static::deleted($clearCache);
        static::restored($clearCache);
    }
}
