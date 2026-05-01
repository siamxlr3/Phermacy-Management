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
            'name' => $this->name,
            'generic_name' => $this->generic_name,
            
            'category_name' => $this->category_name,
            'manufacturer_name' => $this->manufacturer_name,
            
            'dosage_form' => $this->dosage_form,
            'strength' => $this->strength,
            
            // Group A
            'tablet_per_stripe' => $this->tablet_per_stripe,
            'stripe_per_box' => $this->stripe_per_box,
            'price_per_tablet' => $this->price_per_tablet,
            'price_per_stripe' => $this->price_per_stripe,
            'price_per_box' => $this->price_per_box,
            
            // Group B
            'volume' => $this->volume,
            'price' => $this->price,
            
            'reorder_level' => $this->reorder_level,
            'stock' => $this->stock ?? 0,
            'status' => $this->status,
        ];
    }
}
