<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MedicineResource extends JsonResource
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
            'medicine_name' => (string) $this->medicine_name,
            'generic_name' => (string) $this->generic_name,
            
            'category' => (string) $this->category,
            'manufacturer' => (string) $this->manufacturer,
            
            'dosage_form' => (string) $this->dosage_form,
            'strength' => (string) $this->strength,
            
            'unit_type' => (string) $this->unit_type,
            'sale_unit_label' => (string) $this->sale_unit_label,
            
            'tablets_per_strip' => (int) $this->tablets_per_strip,
            'strips_per_box' => (int) $this->strips_per_box,
            'package_size' => (string) $this->package_size,
            
            'price_per_unit' => (float) $this->price_per_unit,
            'price_per_stripe' => (float) $this->price_per_stripe,
            'price_per_box' => (float) $this->price_per_box,
            'mrp' => (float) $this->mrp,
            
            // Sensitive data: only visible to admins/authorized users
            'cost_price' => (float) $this->cost_price,
            
            'reorder_level' => (int) $this->reorder_level,
            'stock' => (int) ($this->stock ?? 0),
            'is_active' => (bool) $this->is_active,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
