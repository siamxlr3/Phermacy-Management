<?php

namespace App\Http\Requests\Api\HRM;

use Illuminate\Foundation\Http\FormRequest;

class LeaveTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('leavetype');

        return [
            'name' => 'required|string|unique:leave_types,name,' . $id,
            'days_allowed' => 'required|integer|min:1',
            'description' => 'nullable|string',
            'status' => 'required|in:active,inactive'
        ];
    }
}
