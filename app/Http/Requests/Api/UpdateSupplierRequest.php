<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSupplierRequest extends FormRequest
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
        $supplierId = $this->route('supplier')->id ?? $this->route('supplier');
        return [
            'name' => 'sometimes|required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'sometimes|required|string|max:20|unique:suppliers,phone,' . $supplierId,
            'email' => 'nullable|email|max:255|unique:suppliers,email,' . $supplierId,
            'address' => 'nullable|string',
            'credit_days' => 'nullable|integer|min:0',
            'status' => 'nullable|in:Active,Inactive',
        ];
    }
}
