<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StockResource extends JsonResource
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
            'name' => (string) $this->medicine_name,
            'generic_name' => (string) $this->generic_name,
            'dosage_form' => (string) $this->dosage_form,
            'strength' => (string) $this->strength,
            'category_name' => (string) $this->category,
            'manufacturer_name' => (string) $this->manufacturer,
            
            // Cast sum results to prevent string output from DB
            'total_stock' => (int) ($this->total_stock ?? 0),
            'reorder_level' => (int) ($this->reorder_level ?? 0),
            
            'tablets_per_strip' => (int) $this->tablets_per_strip,
            'strips_per_box' => (int) $this->strips_per_box,
            'sale_unit_label' => (string) $this->sale_unit_label,
            'status' => (string) ($this->is_active ? 'Active' : 'Inactive'),
            
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
