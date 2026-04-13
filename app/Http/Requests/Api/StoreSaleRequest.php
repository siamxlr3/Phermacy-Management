<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class StoreSaleRequest extends FormRequest
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
            'subtotal' => 'required|numeric|min:0',
            'tax_total' => 'nullable|numeric|min:0',
            'discount_total' => 'nullable|numeric|min:0',
            'grand_total' => 'required|numeric|min:0',
            'payment_method' => 'nullable|string',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.medicine_id' => 'required|exists:medicines,id',
            'items.*.sale_unit' => 'required|string',
            'items.*.qty_tablets' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_amount' => 'nullable|numeric|min:0',
            'items.*.subtotal' => 'required|numeric|min:0',
        ];
    }
}
