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
            'name' => 'required|string|max:255',
            'generic_name' => 'nullable|string|max:255',
            'category_name' => 'required|string|max:255',
            'manufacturer_name' => 'required|string|max:255',
            'dosage_form' => 'required|string',
            'strength' => 'nullable|string|max:100',
            
            // Group A Validation
            'tablet_per_stripe' => 'required_if:dosage_form,Tablet,Capsule,Suppository,Patch|nullable|integer|min:1',
            'stripe_per_box' => 'required_if:dosage_form,Tablet,Capsule,Suppository,Patch|nullable|integer|min:1',
            'price_per_tablet' => 'required_if:dosage_form,Tablet,Capsule,Suppository,Patch|nullable|numeric|min:0',
            'price_per_stripe' => 'required_if:dosage_form,Tablet,Capsule,Suppository,Patch|nullable|numeric|min:0',
            'price_per_box' => 'required_if:dosage_form,Tablet,Capsule,Suppository,Patch|nullable|numeric|min:0',
            
            // Group B Validation
            'volume' => 'required_if:dosage_form,Syrup,Suspension,Injection,Cream,Ointment,Gel,Drops,Inhaler,Powder,Lotion|nullable|string|max:100',
            'price' => 'required_if:dosage_form,Syrup,Suspension,Injection,Cream,Ointment,Gel,Drops,Inhaler,Powder,Lotion|nullable|numeric|min:0',
            
            'reorder_level' => 'required|integer|min:0',
            'status' => 'required|in:Active,Inactive',
        ];
    }
}
