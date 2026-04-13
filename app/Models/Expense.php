<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_id',
        'supplier_name',
        'contact_person',
        'phone',
        'address',
        'expense_date',
        'grand_total',
        'status',
    ];

    protected $casts = [
        'expense_date' => 'date',
        'grand_total' => 'decimal:2',
    ];

    public function items()
    {
        return $this->hasMany(ExpenseItem::class);
    }
}
