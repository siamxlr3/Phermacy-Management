<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class StoreReturnRequest extends FormRequest
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
            'sale_id' => 'required|exists:sales,id',
            'subtotal_returned' => 'required|numeric|min:0',
            'tax_returned' => 'nullable|numeric|min:0',
            'total_returned' => 'required|numeric|min:0',
            'reason' => 'nullable|string|max:255',
            'refund_method' => 'required|in:cash,card,online,store_credit',
            'original_payment_method' => 'required|in:cash,card,online,due',
            'return_type' => 'required|in:full,partial',
            'items' => 'required|array|min:1',
            'items.*.sale_item_id' => 'required|exists:sale_items,id',
            'items.*.qty_returned' => 'required|integer|min:1',
            'items.*.return_condition' => 'nullable|in:resellable,damaged,expired',
        ];
    }
}
