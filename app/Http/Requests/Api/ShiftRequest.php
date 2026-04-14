<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class ShiftRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'start_time' => 'required|string', // Relaxed to allow various 12h formats if needed, but we'll enforce hh:mm AM/PM in the resource/form
            'end_time' => 'required|string',
            'total_hours' => 'required|numeric|min:0',
            'status' => 'required|in:active,inactive',
        ];
    }
}
