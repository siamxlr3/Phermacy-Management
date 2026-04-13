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
        'unit_cost',
        'subtotal',
    ];

    protected $casts = [
        'expiry_date' => 'date',
        'unit_cost' => 'decimal:2',
        'subtotal' => 'decimal:2',
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
