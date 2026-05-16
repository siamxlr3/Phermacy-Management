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
            'medicine_name' => 'sometimes|required|string|max:255',
            'generic_name' => 'sometimes|nullable|string|max:255',
            'category' => 'sometimes|required|string|max:255',
            'manufacturer' => 'sometimes|required|string|max:255',
            'dosage_form' => 'sometimes|required|in:Tablet,Capsule,Syrup,Drops,Cream,Ointment,Gel,Lotion,Suspension,Injection,Inhaler,Powder,Suppository,Patch,Sachet',
            'strength' => 'sometimes|nullable|string|max:100',
            'unit_type' => 'sometimes|required|string|max:100',
            'sale_unit_label' => 'sometimes|required|string|max:100',
            'tablets_per_strip' => 'sometimes|nullable|integer|min:1',
            'strips_per_box' => 'sometimes|nullable|integer|min:1',
            'package_size' => 'sometimes|nullable|string|max:100',
            'price_per_unit' => 'sometimes|required|numeric|min:0',
            'price_per_stripe' => 'sometimes|nullable|numeric|min:0',
            'price_per_box' => 'sometimes|nullable|numeric|min:0',
            'mrp' => 'sometimes|required|numeric|min:0',
            'reorder_level' => 'sometimes|required|integer|min:0',
            'is_active' => 'sometimes|required|boolean',
        ];
    }
}
