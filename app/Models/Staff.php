<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Staff extends Model
{
    use HasFactory;

    protected $table = 'staff_management';

    protected $fillable = [
        'employee_id',
        'full_name',
        'phone',
        'email',
        'address',
        'designation',
        'join_date',
        'basic_salary',
        'nid_number',
        'status',
        'shift_id',
        'role_id'
    ];

    protected $casts = [
        'join_date' => 'date',
        'basic_salary' => 'decimal:2',
        'status' => 'string'
    ];

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function shift()
    {
        return $this->belongsTo(Shift::class, 'shift_id');
    }
}
