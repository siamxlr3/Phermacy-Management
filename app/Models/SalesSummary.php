<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesSummary extends Model
{
    use HasFactory;

    protected $fillable = [
        'date',
        'total_gross',
        'total_revenue',
        'total_completed',
        'total_tax',
        'total_discount',
        'total_cogs',
        'total_returned',
        'total_due',
        'transaction_count',
        'returns_count',
        'due_customers_count',
    ];

    protected $casts = [
        'date' => 'date',
        'total_gross' => 'decimal:2',
        'total_revenue' => 'decimal:2',
        'total_completed' => 'decimal:2',
        'total_tax' => 'decimal:2',
        'total_discount' => 'decimal:2',
        'total_cogs' => 'decimal:2',
        'total_returned' => 'decimal:2',
        'total_due' => 'decimal:2',
        'transaction_count' => 'integer',
        'returns_count' => 'integer',
        'due_customers_count' => 'integer',
    ];
}
