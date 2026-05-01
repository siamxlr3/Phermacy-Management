<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GRNResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'purchase_order_id' => $this->purchase_order_id,
            'purchase_order' => new PurchaseOrderResource($this->whenLoaded('purchaseOrder')),
            'supplier_id' => $this->supplier_id,
            'supplier' => new SupplierResource($this->whenLoaded('supplier')),
            'received_date' => $this->received_date->format('Y-m-d'),
            'invoice_number' => $this->invoice_number,
            'received_by' => $this->received_by,
            'total_amount' => $this->total_amount,
            'paid_amount' => $this->paid_amount,
            'payment_status' => $this->payment_status,
            'notes' => $this->notes,
            'items' => GRNItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
        ];
    }
}
