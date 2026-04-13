<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BatchResource extends JsonResource
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
            'supplier_id' => $this->supplier_id,
            'supplier_name' => $this->supplier->name ?? 'Unknown',
            'batch_number' => $this->batch_number,
            'expiry_date' => $this->expiry_date->format('Y-m-d'),
            'qty_tablets' => $this->qty_tablets,
            'qty_tablets_remaining' => $this->qty_tablets_remaining,
            'cost_per_tablet' => $this->cost_per_tablet,
            'received_date' => $this->received_date->format('Y-m-d'),
            'medicine' => new MedicineResource($this->whenLoaded('medicine')),
            'supplier' => new SupplierResource($this->whenLoaded('supplier')),
        ];
    }
}
