<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Log;

class PurchaseOrderRequest extends FormRequest
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
            'supplier_id' => 'required|exists:suppliers,id',
            'order_date' => 'required|date',
            'notes' => 'nullable|string',
            'paid_amount' => 'nullable|numeric|min:0',
            'payment_status' => 'nullable|string|in:Due,Paid,Partial',
            'items' => 'required|array|min:1',
            'items.*.medicine_id' => 'required|exists:medicines,id',
            'items.*.dosage_form_snapshot' => 'required|string',
            'items.*.qty_boxes' => 'required|integer|min:1',
            'items.*.cost_per_box' => 'required|numeric|min:0',
            'items.*.cost_per_unit' => 'required|numeric|min:0',
            'items.*.cost_per_stripe' => 'nullable|numeric|min:0',
        ];
    }

    /**
     * Handle a failed validation attempt.
     */
    protected function failedValidation(Validator $validator)
    {
        Log::error('Purchase Order Validation Failed', $validator->errors()->toArray());
        throw new HttpResponseException(response()->json([
            'message' => 'The given data was invalid.',
            'errors' => $validator->errors(),
        ], 422));
    }
}
