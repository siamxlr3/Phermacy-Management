<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property string $transaction_id
 * @property string|null $supplier_name
 * @property string|null $contact_person
 * @property string|null $phone
 * @property string|null $address
 * @property \Illuminate\Support\Carbon $expense_date
 * @property float $grand_total
 * @property string $status
 */
class Expense extends Model
{
    use HasFactory, SoftDeletes;

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
