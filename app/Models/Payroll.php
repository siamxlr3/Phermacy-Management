<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payroll extends Model
{
    use HasFactory;

    protected $fillable = [
        'staff_id',
        'month',
        'year',
        'net_salary',
        'bonus',
        'deduction',
        'status',
        'paid_at'
    ];

    protected $casts = [
        'paid_at' => 'datetime',
        'net_salary' => 'decimal:2',
        'bonus' => 'decimal:2',
        'deduction' => 'decimal:2',
    ];

    public function staff()
    {
        return $this->belongsTo(Staff::class, 'staff_id');
    }
}
