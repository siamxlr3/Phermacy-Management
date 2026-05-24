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
 * @property string $notes
 */
class PurchaseOrder extends Model
{
    use HasFactory, SoftDeletes;

    // Status Constants
    const STATUS_PENDING   = 'Pending';
    const STATUS_RECEIVED  = 'Received';
    const STATUS_CANCELLED = 'Cancelled';

    // Payment Status Constants
    const PAYMENT_STATUS_DUE     = 'Due';
    const PAYMENT_STATUS_PAID    = 'Paid';
    const PAYMENT_STATUS_PARTIAL = 'Partial';

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
        $this->total_amount = $this->items()->sum('subtotal');
        $this->save();
    }

    /**
     * Atomically sync items and update total.
     * Prevents event bypass issues by centralizing logic.
     */
    public function syncItems(array $items): void
    {
        $this->items()->delete();

        $itemsData = [];
        $totalAmount = 0;

        foreach ($items as $item) {
            $subtotal = (float) ($item['qty_boxes'] * $item['cost_per_box']);
            $totalAmount += $subtotal;

            $itemsData[] = [
                'purchase_order_id' => $this->id,
                'medicine_id'       => $item['medicine_id'],
                'dosage_form_snapshot' => $item['dosage_form_snapshot'],
                'qty_boxes'         => $item['qty_boxes'],
                'cost_per_box'      => $item['cost_per_box'],
                'cost_per_stripe'   => $item['cost_per_stripe'] ?? null,
                'cost_per_unit'     => $item['cost_per_unit'],
                'subtotal'          => $subtotal,
                'created_at'        => now(),
                'updated_at'        => now(),
            ];
        }

        PurchaseOrderItem::insert($itemsData);
        
        $this->update(['total_amount' => $totalAmount]);
    }

    /**
     * Scope a query to only include pending orders.
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }
}
