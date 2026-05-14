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
            'id' => $this->id,
            'name' => $this->medicine_name,
            'generic_name' => $this->generic_name,
            'dosage_form' => $this->dosage_form,
            'strength' => $this->strength,
            'category_name' => $this->category,
            'manufacturer_name' => $this->manufacturer,
            'total_stock' => $this->total_stock ?? 0,
            'reorder_level' => $this->reorder_level,
            'tablet_per_stripe' => $this->tablets_per_strip ?? 10,
            'stripe_per_box' => $this->strips_per_box ?? 10,
            'status' => $this->is_active ? 'Active' : 'Inactive',
        ];
    }
}
