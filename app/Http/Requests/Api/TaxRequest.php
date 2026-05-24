<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TaxRequest extends FormRequest
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
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');
        $taxId = $isUpdate 
            ? ($this->route('tax') instanceof \App\Models\Tax ? $this->route('tax')->id : $this->route('tax')) 
            : null;

        return [
            'name' => [
                $isUpdate ? 'sometimes' : 'required',
                'string',
                'max:255',
                Rule::unique('taxes', 'name')
                    ->ignore($taxId)
                    ->whereNull('deleted_at')
            ],
            'rate' => ($isUpdate ? 'sometimes|' : '') . 'required|numeric|min:0|max:100',
            'status' => ($isUpdate ? 'sometimes|' : '') . 'required|in:Active,Inactive',
        ];
    }
}
