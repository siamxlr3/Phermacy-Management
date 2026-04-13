<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGRNRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'received_date'              => 'required|date',
            'invoice_number'             => 'nullable|string|max:255',
            'received_by'                => 'required|string|max:255',
            'total_amount'               => 'required|numeric|min:0',
            'notes'                      => 'nullable|string',
            'items'                      => 'required|array|min:1',
            'items.*.medicine_id'        => 'required|exists:medicines,id',
            'items.*.batch_number'       => 'required|string|max:255',
            'items.*.expiry_date'        => 'required|date',
            'items.*.qty_boxes_received' => 'required|integer|min:1',
            'items.*.unit_cost'          => 'required|numeric|min:0',
            'items.*.subtotal'           => 'required|numeric|min:0',
        ];
    }
}
