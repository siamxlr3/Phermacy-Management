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
            'medicine_name' => $this->medicine?->medicine_name,
            'medicine_dosage_form' => $this->medicine?->dosage_form,
            'dosage_form_snapshot' => $this->dosage_form_snapshot,
            'batch_number' => $this->batch_number,
            'expiry_date' => $this->expiry_date->format('Y-m-d'),
            'qty_boxes_received' => $this->qty_boxes_received,
            'qty_units_received' => $this->qty_units_received,
            'package_size' => $this->package_size,
            'cost_per_box' => $this->cost_per_box,
            'cost_per_stripe' => $this->cost_per_stripe,
            'cost_per_unit' => $this->cost_per_unit,
            'subtotal' => $this->subtotal,
        ];
    }
}
