<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shift extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'start_time',
        'end_time',
        'total_hours',
        'status'
    ];

    protected $casts = [
        'total_hours' => 'decimal:2',
        'status' => 'string'
    ];

    public function staff()
    {
        return $this->hasMany(Staff::class, 'shift_id');
    }
}
