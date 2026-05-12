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
            'id' => $this->id,
            'medicine_name' => $this->medicine_name,
            'generic_name' => $this->generic_name,
            
            'category' => $this->category,
            'manufacturer' => $this->manufacturer,
            
            'dosage_form' => $this->dosage_form,
            'strength' => $this->strength,
            
            'unit_type' => $this->unit_type,
            'sale_unit_label' => $this->sale_unit_label,
            
            'tablets_per_strip' => $this->tablets_per_strip,
            'strips_per_box' => $this->strips_per_box,
            'package_size' => $this->package_size,
            
            'price_per_unit' => $this->price_per_unit,
            'price_per_stripe' => $this->price_per_stripe,
            'price_per_box' => $this->price_per_box,
            'mrp' => $this->mrp,
            'cost_price' => $this->cost_price,
            
            'reorder_level' => $this->reorder_level,
            'stock' => $this->stock ?? 0,
            'is_active' => $this->is_active,
        ];
    }
}
