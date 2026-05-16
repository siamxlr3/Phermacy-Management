<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTaxRequest extends FormRequest
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
        $taxId = $this->route('tax') instanceof \App\Models\Tax 
            ? $this->route('tax')->id 
            : $this->route('tax');

        return [
            'name' => [
                'sometimes', 
                'required', 
                'string', 
                'max:255', 
                \Illuminate\Validation\Rule::unique('taxes', 'name')->ignore($taxId)
            ],
            'rate' => 'sometimes|required|numeric|min:0|max:100',
            'status' => 'sometimes|required|in:Active,Inactive',
        ];
    }
}
