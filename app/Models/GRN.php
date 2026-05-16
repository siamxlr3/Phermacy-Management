<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property int|null $purchase_order_id
 * @property int $supplier_id
 * @property \Illuminate\Support\Carbon $received_date
 * @property string|null $invoice_number
 * @property string|null $received_by
 * @property float $total_amount
 * @property float $paid_amount
 * @property string $payment_status
 * @property string|null $notes
 */
class GRN extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'grns';

    protected $fillable = [
        'purchase_order_id',
        'supplier_id',
        'received_date',
        'invoice_number',
        'received_by',
        'total_amount',
        'paid_amount',
        'payment_status',
        'notes',
    ];

    protected $casts = [
        'received_date' => 'date',
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
    ];

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class, 'purchase_order_id');
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function items()
    {
        return $this->hasMany(GRNItem::class, 'grn_id');
    }

    /**
     * Get the remaining balance due for this GRN.
     */
    public function getBalanceDueAttribute(): float
    {
        return (float) ($this->total_amount - $this->paid_amount);
    }

    /**
     * Scope a query to filter by payment status.
     */
    public function scopePaymentStatus($query, string $status)
    {
        return $query->where('payment_status', $status);
    }
}
