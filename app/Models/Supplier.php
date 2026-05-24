<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Cache;

/**
 * @property int $id
 * @property string $name
 * @property string|null $contact_person
 * @property string $phone
 * @property string|null $email
 * @property string|null $address
 * @property int $credit_days
 * @property string $status
 */
class Supplier extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'contact_person',
        'phone',
        'email',
        'address',
        'credit_days',
        'status',
    ];

    protected $casts = [
        'credit_days' => 'integer',
    ];

    public function purchaseOrders()
    {
        return $this->hasMany(PurchaseOrder::class);
    }

    public function stockBatches()
    {
        return $this->hasMany(StockBatch::class);
    }

    protected static function booted()
    {
        $clearCache = fn () => Cache::forget('suppliers.active_list');
        
        static::saved($clearCache);
        static::deleted($clearCache);
        static::restored($clearCache);
        static::forceDeleted($clearCache);
    }
}
