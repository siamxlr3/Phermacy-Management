<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AlertResource extends JsonResource
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
            'medicine_name' => $this->medicine->name ?? 'N/A',
            'batch_number' => $this->stockBatch->batch_number ?? 'N/A',
            'type' => $this->type,
            'severity' => $this->severity,
            'message' => $this->message,
            'status' => $this->status,
            'created_at' => $this->created_at->toDateTimeString(),
        ];
    }
}
