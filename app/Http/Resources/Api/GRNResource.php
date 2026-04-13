<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GRNResource extends JsonResource
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
            'received_date' => $this->received_date->format('Y-m-d'),
            'invoice_number' => $this->invoice_number,
            'received_by' => $this->received_by,
            'total_amount' => $this->total_amount,
            'notes' => $this->notes,
            'items' => GRNItemResource::collection($this->whenLoaded('items')),
            'purchase_order' => new PurchaseOrderResource($this->whenLoaded('purchaseOrder')),
            'created_at' => $this->created_at->toDateTimeString(),
        ];
    }
}
