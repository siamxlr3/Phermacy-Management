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
            'id' => (int) $this->id,
            'purchase_order_id' => (int) $this->purchase_order_id,
            'medicine_id' => (int) $this->medicine_id,
            'medicine_name' => (string) $this->whenLoaded('medicine', fn() => $this->medicine->medicine_name),
            'dosage_form_snapshot' => (string) $this->dosage_form_snapshot,
            'qty_boxes' => (int) $this->qty_boxes,
            'cost_per_box' => (float) $this->cost_per_box,
            'cost_per_stripe' => (float) $this->cost_per_stripe,
            'cost_per_unit' => (float) $this->cost_per_unit,
            'subtotal' => (float) $this->subtotal,
        ];
    }
}
