<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExpenseItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'expense_id',
        'items_name',
        'category',
        'qty',
        'price',
        'total_price',
    ];

    protected $casts = [
        'qty' => 'integer',
        'price' => 'decimal:2',
        'total_price' => 'decimal:2',
    ];

    public function expense()
    {
        return $this->belongsTo(Expense::class);
    }
}
