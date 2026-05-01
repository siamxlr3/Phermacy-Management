<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BatchResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'medicine_id' => $this->medicine_id,
            'medicine_name' => $this->medicine?->name,
            'medicine_dosage_form' => $this->medicine?->dosage_form,
            'supplier_id' => $this->supplier_id,
            'supplier_name' => $this->supplier?->name,
            'grn_id' => $this->grn_id,
            'batch_number' => $this->batch_number,
            'expiry_date' => $this->expiry_date->format('Y-m-d'),
            'qty_tablets' => $this->qty_tablets,
            'qty_tablets_remaining' => $this->qty_tablets_remaining,
            'cost_per_tablet' => $this->cost_per_tablet,
            'cost_per_stripe' => $this->cost_per_stripe,
            'cost_per_box' => $this->cost_per_box,
            'volume' => $this->volume,
            'price' => $this->price,
            'strength' => $this->medicine?->strength,
            'received_date' => $this->received_date->format('Y-m-d'),
        ];
    }
}
