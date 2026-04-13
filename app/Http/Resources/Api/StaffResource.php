<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StaffResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'full_name' => $this->full_name,
            'phone' => $this->phone,
            'email' => $this->email,
            'address' => $this->address,
            'designation' => $this->designation,
            'join_date' => $this->join_date ? $this->join_date->format('Y-m-d') : null,
            'basic_salary' => $this->basic_salary,
            'nid_number' => $this->nid_number,
            'status' => $this->status,
            'role_id' => $this->role_id,
            'role_name' => $this->role ? $this->role->name : null,
            'shift_id' => $this->shift_id,
            'shift_name' => $this->shift ? $this->shift->name : null,
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
        ];
    }
}
