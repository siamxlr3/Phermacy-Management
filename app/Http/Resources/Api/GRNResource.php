<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GRNResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (int) $this->id,
            'purchase_order_id' => (int) $this->purchase_order_id,
            'purchase_order' => new PurchaseOrderResource($this->whenLoaded('purchaseOrder')),
            'supplier_id' => (int) $this->supplier_id,
            'supplier' => new SupplierResource($this->whenLoaded('supplier')),
            'received_date' => $this->received_date?->toISOString(),
            'invoice_number' => (string) $this->invoice_number,
            'received_by' => (string) $this->received_by,
            'total_amount' => (float) $this->total_amount,
            'paid_amount' => (float) $this->paid_amount,
            'balance_due' => (float) ($this->balance_due ?? 0),
            'payment_status' => (string) $this->payment_status,
            'notes' => (string) $this->notes,
            'items' => GRNItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
