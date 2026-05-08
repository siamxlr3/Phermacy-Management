<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property int $grn_id
 * @property int $medicine_id
 * @property string $batch_number
 * @property \Illuminate\Support\Carbon $expiry_date
 * @property int $qty_boxes_received
 * @property float $subtotal
 * @property float|null $cost_per_box
 * @property float|null $cost_per_stripe
 * @property float|null $cost_per_tablet
 * @property string|null $strength
 * @property string|null $volume
 * @property float|null $price
 */
class GRNItem extends Model
{
    use HasFactory, SoftDeletes;
    
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
        'cost_per_box' => 'decimal:4',
        'cost_per_stripe' => 'decimal:4',
        'cost_per_tablet' => 'decimal:4',
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
