<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseOrderItemResource extends JsonResource
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
            'purchase_order_id' => $this->purchase_order_id,
            'medicine_id' => $this->medicine_id,
            'medicine_name' => $this->whenLoaded('medicine', fn() => $this->medicine->name),
            'dosage_form_snapshot' => $this->dosage_form_snapshot,
            'qty_boxes' => $this->qty_boxes,
            'cost_per_box' => $this->cost_per_box,
            'cost_per_stripe' => $this->cost_per_stripe,
            'cost_per_unit' => $this->cost_per_unit,
            'subtotal' => $this->subtotal,
        ];
    }
}
