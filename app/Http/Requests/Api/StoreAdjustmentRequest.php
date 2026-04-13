<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class StoreAdjustmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'medicine_id' => 'required|exists:medicines,id',
            'stock_batch_id' => 'required|exists:stock_batches,id',
            'type' => 'required|in:Return,Damage,Correction',
            'reason' => 'nullable|string|max:255',
            'qty_tablets_changed' => 'required|integer|min:1',
            'adjustment_date' => 'nullable|date',
        ];
    }
}
