<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class SupplierRequest extends FormRequest
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
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $supplierId = $this->route('supplier')->id ?? $this->route('supplier');
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'name' => ($isUpdate ? 'sometimes|' : '') . 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => ($isUpdate ? 'sometimes|' : '') . 'required|string|max:20|unique:suppliers,phone' . ($supplierId ? ',' . $supplierId : ''),
            'email' => 'nullable|email|max:255|unique:suppliers,email' . ($supplierId ? ',' . $supplierId : ''),
            'address' => 'nullable|string',
            'credit_days' => 'nullable|integer|min:0',
            'status' => 'nullable|in:Active,Inactive',
        ];
    }
}
