<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property int $expense_id
 * @property string $items_name
 * @property string $category
 * @property int $qty
 * @property float $price
 * @property float $total_price
 */
class ExpenseItem extends Model
{
    use HasFactory, SoftDeletes;

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
