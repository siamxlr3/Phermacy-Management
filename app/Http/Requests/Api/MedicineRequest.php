<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class MedicineRequest extends FormRequest
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
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'medicine_name' => ($isUpdate ? 'sometimes|' : '') . 'required|string|max:255',
            'generic_name' => 'nullable|string|max:255',
            'category' => ($isUpdate ? 'sometimes|' : '') . 'required|string|max:255',
            'manufacturer' => ($isUpdate ? 'sometimes|' : '') . 'required|string|max:255',
            'dosage_form' => ($isUpdate ? 'sometimes|' : '') . 'required|in:Tablet,Capsule,Syrup,Drops,Cream,Ointment,Gel,Lotion,Suspension,Injection,Inhaler,Powder,Suppository,Patch,Sachet',
            'strength' => 'nullable|string|max:100',
            'unit_type' => ($isUpdate ? 'sometimes|' : '') . 'required|string|max:100',
            'sale_unit_label' => ($isUpdate ? 'sometimes|' : '') . 'required|string|max:100',
            'tablets_per_strip' => 'nullable|required_if:unit_type,Strip,Box|integer|min:1',
            'strips_per_box' => 'nullable|required_if:unit_type,Box|integer|min:1',
            'package_size' => 'nullable|string|max:100',
            'price_per_unit' => ($isUpdate ? 'sometimes|' : '') . 'required|numeric|min:0',
            'price_per_stripe' => 'nullable|numeric|min:0',
            'price_per_box' => 'nullable|numeric|min:0',
            'mrp' => ($isUpdate ? 'sometimes|' : '') . 'required|numeric|min:0',
            'reorder_level' => ($isUpdate ? 'sometimes|' : '') . 'required|integer|min:0',
            'is_active' => ($isUpdate ? 'sometimes|' : '') . 'required|boolean',
        ];
    }
}
