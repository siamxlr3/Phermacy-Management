<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockAdjustment extends Model
{
    use HasFactory;

    protected $fillable = [
        'medicine_id',
        'stock_batch_id',
        'user_id',
        'type',
        'reason',
        'qty_tablets_changed',
        'adjustment_date',
    ];

    protected $casts = [
        'adjustment_date' => 'date',
    ];

    public function medicine()
    {
        return $this->belongsTo(Medicine::class);
    }

    public function batch()
    {
        return $this->belongsTo(StockBatch::class, 'stock_batch_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
