<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PayrollRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $payrollId = $this->route('payroll');

        return [
            'staff_id' => 'required|exists:staff_management,id',
            'month' => 'required|string',
            'year' => 'required|integer|min:2020|max:' . (date('Y') + 1),
            'net_salary' => 'required|numeric|min:0',
            'bonus' => 'nullable|numeric|min:0',
            'deduction' => 'nullable|numeric|min:0',
            'status' => 'required|in:paid,unpaid',
            'paid_at' => 'nullable|date',
            // Unique constraint check: staff_id, month, year
            'staff_id' => [
                'required',
                'exists:staff_management,id',
                Rule::unique('payrolls')->where(function ($query) {
                    return $query->where('staff_id', $this->staff_id)
                                 ->where('month', $this->month)
                                 ->where('year', $this->year);
                })->ignore($payrollId)
            ]
        ];
    }
}
