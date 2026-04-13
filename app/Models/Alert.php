<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Alert extends Model
{
    use HasFactory;

    protected $fillable = [
        'medicine_id',
        'stock_batch_id',
        'type',
        'severity',
        'message',
        'status',
    ];

    public function medicine()
    {
        return $this->belongsTo(Medicine::class);
    }

    public function stockBatch()
    {
        return $this->belongsTo(StockBatch::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'Active');
    }
}
