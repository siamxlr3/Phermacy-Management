<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'staff_id' => $this->staff_id,
            'staff_name' => $this->staff->full_name ?? 'N/A',
            'employee_id' => $this->staff->employee_id ?? 'N/A',
            'date' => $this->date->format('Y-m-d'),
            'check_in' => $this->check_in,
            'check_out' => $this->check_out,
            'status' => $this->status,
            'shift_name' => $this->shift->name ?? 'N/A',
            'note' => $this->note,
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
        ];
    }
}
