<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStaffRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('staff');
        return [
            'full_name' => 'required|string|max:255',
            'employee_id' => 'required|string|max:255|unique:staff_management,employee_id,' . $id,
            'phone' => 'required|string|max:20',
            'email' => 'required|email|unique:staff_management,email,' . $id,
            'address' => 'nullable|string',
            'designation' => 'nullable|string|max:255',
            'join_date' => 'required|date',
            'basic_salary' => 'required|numeric|min:0',
            'nid_number' => 'required|string|unique:staff_management,nid_number,' . $id,
            'status' => 'required|in:active,resigned,terminated',
            'shift_id' => 'required|exists:shifts,id',
            'role_id' => 'required|exists:roles,id',
        ];
    }
}
