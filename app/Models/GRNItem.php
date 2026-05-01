<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GRNItem extends Model
{
    use HasFactory;
    
    protected $table = 'grn_items';

    protected $fillable = [
        'grn_id',
        'medicine_id',
        'batch_number',
        'expiry_date',
        'qty_boxes_received',
        'subtotal',
        'cost_per_box',
        'cost_per_stripe',
        'cost_per_tablet',
        'strength',
        'volume',
        'price',
    ];

    protected $casts = [
        'expiry_date' => 'date',
        'subtotal' => 'decimal:2',
        'cost_per_box' => 'decimal:2',
        'cost_per_stripe' => 'decimal:2',
        'cost_per_tablet' => 'decimal:2',
        'price' => 'decimal:2',
    ];

    public function grn()
    {
        return $this->belongsTo(GRN::class);
    }

    public function medicine()
    {
        return $this->belongsTo(Medicine::class);
    }
}
