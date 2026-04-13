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
            'qty_boxes' => $this->qty_boxes,
            'unit_cost' => $this->unit_cost,
            'subtotal' => $this->subtotal,
        ];
    }
}
