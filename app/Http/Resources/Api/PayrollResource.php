<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PayrollResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'staff_id' => $this->staff_id,
            'staff_name' => $this->staff->full_name ?? 'N/A',
            'employee_id' => $this->staff->employee_id ?? 'N/A',
            'basic_salary' => $this->staff->basic_salary ?? 0,
            'month' => $this->month,
            'year' => $this->year,
            'net_salary' => $this->net_salary,
            'bonus' => $this->bonus,
            'deduction' => $this->deduction,
            'status' => $this->status,
            'paid_at' => $this->paid_at ? $this->paid_at->format('Y-m-d H:i:s') : null,
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
        ];
    }
}
