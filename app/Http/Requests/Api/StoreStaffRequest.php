<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class StoreStaffRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'full_name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'required|email|unique:staff_management,email',
            'address' => 'nullable|string',
            'designation' => 'required|string|max:255',
            'join_date' => 'required|date',
            'basic_salary' => 'required|numeric|min:0',
            'nid_number' => 'required|string|unique:staff_management,nid_number',
            'status' => 'required|in:active,resigned,terminated',
            'shift_id' => 'required|exists:shifts,id',
            'role_id' => 'required|exists:roles,id',
        ];
    }
}
