<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockBatch extends Model
{
    use HasFactory;

    protected $fillable = [
        'medicine_id',
        'supplier_id',
        'grn_id',
        'batch_number',
        'expiry_date',
        'qty_tablets',
        'qty_tablets_remaining',
        'cost_per_tablet',
        'received_date',
    ];

    protected $casts = [
        'expiry_date' => 'date',
        'received_date' => 'date',
        'cost_per_tablet' => 'decimal:2',
    ];

    public function medicine()
    {
        return $this->belongsTo(Medicine::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function grn()
    {
        return $this->belongsTo(GRN::class);
    }

    public function adjustments()
    {
        return $this->hasMany(StockAdjustment::class);
    }
}
