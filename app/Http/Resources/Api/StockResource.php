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
            'name' => $this->name,
            'generic_name' => $this->generic_name,
            'dosage_form' => $this->dosage_form,
            'strength' => $this->strength,
            'category_name' => $this->category_name,
            'manufacturer_name' => $this->manufacturer_name,
            'total_stock' => $this->total_stock ?? 0,
            'reorder_level' => $this->reorder_level,
            'tablet_per_stripe' => $this->tablet_per_stripe ?? 10,
            'stripe_per_box' => $this->stripe_per_box ?? 10,
            'status' => $this->status,
        ];
    }
}
