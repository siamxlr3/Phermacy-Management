<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property int|null $user_id
 * @property string $invoice_number
 * @property string|null $customer_name
 * @property string|null $customer_phone
 * @property \Illuminate\Support\Carbon $sale_date
 * @property float $subtotal
 * @property float $tax_total
 * @property float $discount_total
 * @property float $grand_total
 * @property float $refunded_amount
 * @property float $refunded_subtotal
 * @property float $paid_amount
 * @property float $due_amount
 * @property string $payment_method
 * @property string $status
 * @property string|null $notes
 * @property-read float $net_total
 * @property-read bool $is_paid
 * @property-read bool $is_due
 */
class Sale extends Model
{
    use HasFactory, SoftDeletes;
    
    protected static function booted()
    {
        static::saved(function ($sale) {
            \App\Jobs\UpdateDailySummary::dispatch($sale->sale_date);
        });

        static::deleted(function ($sale) {
            \App\Jobs\UpdateDailySummary::dispatch($sale->sale_date);
        });
    }

    // Status Constants
    const STATUS_COMPLETED          = 'Completed';
    const STATUS_PARTIALLY_RETURNED = 'Partially Returned';
    const STATUS_RETURNED           = 'Returned';
    const STATUS_CANCELLED          = 'Cancelled';

    const SUCCESS_STATUSES = [
        self::STATUS_COMPLETED,
        self::STATUS_PARTIALLY_RETURNED,
        self::STATUS_RETURNED
    ];

    protected $fillable = [
        'user_id',
        'invoice_number',
        'customer_name',
        'customer_phone',
        'sale_date',
        'subtotal',
        'tax_total',
        'discount_total',
        'grand_total',
        'paid_amount',
        'due_amount',
        'refunded_amount',
        'refunded_subtotal',
        'payment_method',
        'status',
        'notes',
        'total_items_count',
        'returned_items_count',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'sale_date' => 'datetime',
        'subtotal' => 'decimal:2',
        'tax_total' => 'decimal:2',
        'discount_total' => 'decimal:2',
        'grand_total' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'due_amount' => 'decimal:2',
        'refunded_amount' => 'decimal:2',
        'refunded_subtotal' => 'decimal:2',
        'total_items_count' => 'integer',
        'returned_items_count' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }

    public function returns()
    {
        return $this->hasMany(SalesReturn::class);
    }

    /**
     * Scope for successful sales that contribute to revenue.
     */
    public function scopeSuccessful($query)
    {
        return $query->whereIn('status', self::SUCCESS_STATUSES);
    }

    /**
     * Recalculate and save the totals based on items
     */
    public function syncTotal(): void
    {
        $this->subtotal = $this->items()->sum('subtotal');
        $this->tax_total = $this->items()->sum('tax_amount');
        $this->grand_total = ($this->subtotal + $this->tax_total) - $this->discount_total;
        $this->save();
    }

    /**
     * Get the net total (grand total minus refunds).
     */
    public function getNetTotalAttribute(): float
    {
        return (float) ($this->grand_total - ($this->refunded_subtotal ?? 0));
    }

    /**
     * Check if the sale is fully paid.
     */
    public function getIsPaidAttribute(): bool
    {
        return $this->status === 'Completed' && $this->due_amount <= 0;
    }

    /**
     * Check if the sale has an outstanding balance.
     */
    public function getIsDueAttribute(): bool
    {
        return $this->due_amount > 0;
    }

    /**
     * Get consolidated sales summary for the dashboard.
     */
    public static function getDashboardSummary($start, $end)
    {
        return app(\App\Services\SaleReportService::class)->getSummary($start, $end);
    }

    /**
     * Get top performing medicines.
     */
    public static function getTopPerformers($start, $end, $limit = 50)
    {
        return SaleItem::selectRaw('
                medicines.medicine_name,
                medicines.generic_name,
                medicines.dosage_form,
                SUM(sale_items.qty_tablets) as total_qty,
                SUM(sale_items.subtotal) as total_revenue
            ')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('medicines', 'sale_items.medicine_id', '=', 'medicines.id')
            ->where('sales.status', self::STATUS_COMPLETED)
            ->whereBetween('sales.sale_date', [$start, $end])
            ->groupBy('medicines.id', 'medicines.medicine_name', 'medicines.generic_name', 'medicines.dosage_form')
            ->orderByDesc('total_qty')
            ->limit($limit)
            ->get();
    }
}
