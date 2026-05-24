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
            'id' => (int) $this->id,
            'medicine_id' => (int) $this->medicine_id,
            'medicine_name' => $this->whenLoaded('medicine', function() {
                return (string) ($this->medicine->medicine_name ?? 'N/A');
            }, 'N/A'),
            'stock_batch_id' => (int) $this->stock_batch_id,
            'batch_number' => $this->whenLoaded('stockBatch', function() {
                return (string) ($this->stockBatch->batch_number ?? 'N/A');
            }, 'N/A'),
            'type' => (string) $this->type,
            'severity' => (string) $this->severity,
            'message' => (string) $this->message,
            'status' => (string) $this->status,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
