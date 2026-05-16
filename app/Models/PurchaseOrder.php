<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property int $supplier_id
 * @property \Illuminate\Support\Carbon $order_date
 * @property string $status
 * @property string $payment_status
 * @property float $total_amount
 * @property float $paid_amount
 * @property string|null $notes
 */
class PurchaseOrder extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'supplier_id',
        'order_date',
        'status',
        'payment_status',
        'total_amount',
        'paid_amount',
        'notes',
    ];

    protected $casts = [
        'order_date' => 'date',
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function items()
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function grns()
    {
        return $this->hasMany(GRN::class, 'purchase_order_id');
    }

    /**
     * Re-calculate and save the total amount based on items.
     */
    public function syncTotal(): void
    {
        $this->total_amount = (float) $this->items()->sum('subtotal');
        $this->save();
    }

    /**
     * Scope a query to only include pending orders.
     */
    public function scopePending($query)
    {
        return $query->where('status', 'Pending');
    }
}
