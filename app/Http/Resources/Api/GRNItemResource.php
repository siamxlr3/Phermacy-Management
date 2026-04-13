<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GRNItemResource extends JsonResource
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
            'medicine_id' => $this->medicine_id,
            'medicine_name' => $this->medicine->name ?? 'Unknown',
            'batch_number' => $this->batch_number,
            'expiry_date' => $this->expiry_date->format('Y-m-d'),
            'qty_boxes_received' => $this->qty_boxes_received,
            'unit_cost' => $this->unit_cost,
            'subtotal' => $this->subtotal,
            'medicine' => new MedicineResource($this->whenLoaded('medicine')),
        ];
    }
}
