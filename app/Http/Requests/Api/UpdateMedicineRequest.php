<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMedicineRequest extends FormRequest
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
            'medicine_name' => 'required|string|max:255',
            'generic_name' => 'nullable|string|max:255',
            'category' => 'required|string|max:255',
            'manufacturer' => 'required|string|max:255',
            'dosage_form' => 'required|in:Tablet,Capsule,Syrup,Drops,Cream,Ointment,Gel,Lotion,Suspension,Injection,Inhaler,Powder,Suppository,Patch,Sachet',
            'strength' => 'nullable|string|max:100',
            'unit_type' => 'required|string|max:100',
            'sale_unit_label' => 'required|string|max:100',
            'tablets_per_strip' => 'nullable|integer|min:1',
            'strips_per_box' => 'nullable|integer|min:1',
            'package_size' => 'nullable|string|max:100',
            'price_per_unit' => 'required|numeric|min:0',
            'price_per_stripe' => 'nullable|numeric|min:0',
            'price_per_box' => 'nullable|numeric|min:0',
            'mrp' => 'required|numeric|min:0',
            'reorder_level' => 'required|integer|min:0',
            'is_active' => 'required|boolean',
        ];
    }
}
