<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'supplier_name' => 'nullable|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:1000',
            'expense_date' => 'nullable|date',
            'grand_total' => 'required|numeric|min:0',
            'status' => 'required|in:Paid,Unpaid',
            'items' => 'required|array|min:1',
            'items.*.items_name' => 'required|string|max:255',
            'items.*.category' => 'required|in:Piece,Packet,Box',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.total_price' => 'required|numeric|min:0',
        ];
    }
}
