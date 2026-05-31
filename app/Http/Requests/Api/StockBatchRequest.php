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
            'per_page' => 'nullable|integer|min:1|max:100',
            'search' => 'nullable|string|max:255',
            'from_expiry' => 'nullable|date',
            'to_expiry' => 'nullable|date|after_or_equal:from_expiry',
            'medicine_id' => 'nullable|exists:medicines,id',
        ];
    }
}
