<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class StockBatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'search' => ['nullable', 'string', 'max:100'],
            'medicine_id' => ['sometimes', 'integer', 'exists:medicines,id'],
            'from_expiry' => ['nullable', 'date', 'date_format:Y-m-d'],
            'to_expiry' => ['nullable', 'date', 'date_format:Y-m-d', 'after_or_equal:from_expiry'],
        ];
    }
}
