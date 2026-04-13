<?php

namespace App\Http\Resources\Api\HRM;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeaveTypeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'days_allowed' => $this->days_allowed,
            'description' => $this->description,
            'status' => $this->status,
        ];
    }
}
