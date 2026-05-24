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
            'purchase_order_id' => 'nullable|exists:purchase_orders,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'received_date' => 'required|date',
            'invoice_number' => 'nullable|string|max:255',
            'received_by' => 'nullable|string|max:255',
            'total_amount' => 'required|numeric|min:0',
            'paid_amount' => 'required|numeric|min:0',
            'payment_status' => 'required|in:Paid,Due,Partially Paid',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.medicine_id' => 'required|exists:medicines,id',
            'items.*.dosage_form_snapshot' => 'required|string',
            'items.*.batch_number' => 'nullable|string|max:255',
            'items.*.expiry_date' => 'required|date',
            'items.*.qty_boxes_received' => 'required|integer|min:1',
            'items.*.qty_units_received' => 'nullable|integer|min:0',
            'items.*.package_size' => 'nullable|string|max:100',
            'items.*.cost_per_box' => 'nullable|numeric|min:0',
            'items.*.cost_per_stripe' => 'nullable|numeric|min:0',
            'items.*.cost_per_unit' => 'required|numeric|min:0',
            'items.*.subtotal' => 'required|numeric|min:0',
        ];
    }
}
