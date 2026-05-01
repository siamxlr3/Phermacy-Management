<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GRNItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'medicine_id' => $this->medicine_id,
            'medicine_name' => $this->medicine?->name,
            'medicine_dosage_form' => $this->medicine?->dosage_form,
            'batch_number' => $this->batch_number,
            'expiry_date' => $this->expiry_date->format('Y-m-d'),
            'qty_boxes_received' => $this->qty_boxes_received,
            'subtotal' => $this->subtotal,
            'cost_per_box' => $this->cost_per_box,
            'cost_per_stripe' => $this->cost_per_stripe,
            'cost_per_tablet' => $this->cost_per_tablet,
            'strength' => $this->strength,
            'volume' => $this->volume,
            'price' => $this->price,
        ];
    }
}
