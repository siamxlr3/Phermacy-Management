<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StockAdjustmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'medicine_id' => 'required|exists:medicines,id',
            'stock_batch_id' => 'required|exists:stock_batches,id',
            'adjustment_type' => 'required|string|in:damage,expired,opening_balance,correction,theft,lost',
            'adjustment_unit' => 'required|string|in:piece,strip,box,bottle,tube,vial,inhaler,pack',
            'qty_in_units' => 'required|integer|min:1',
            'note' => 'nullable|string|max:500',
        ];
    }
}
