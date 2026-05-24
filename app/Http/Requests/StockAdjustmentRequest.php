<?php

namespace App\Http\Requests;

use App\Models\StockAdjustment;
use Illuminate\Validation\Rule;

class StockAdjustmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Add actual permission check here, e.g. return $this->user()->can('manage-inventory');
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
            'adjustment_type' => [
                'required',
                'string',
                Rule::in(StockAdjustment::getAdjustmentTypes()),
            ],
            'adjustment_unit' => [
                'required',
                'string',
                Rule::in(StockAdjustment::getAdjustmentUnits()),
            ],
            'qty_in_units' => 'required|integer|min:1',
            'note' => 'nullable|string|max:500',
        ];
    }
}
