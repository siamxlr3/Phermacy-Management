<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SalesReturnResource extends JsonResource
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
            'sale_id' => (int) $this->sale_id,
            'user_id' => (int) $this->user_id,
            'user_name' => (string) ($this->user->name ?? 'System'),
            'sale_invoice' => (string) ($this->sale->invoice_number ?? 'N/A'),
            'return_invoice_number' => (string) $this->return_invoice_number,
            'return_date' => $this->return_date?->toISOString(),
            'subtotal_returned' => (float) $this->subtotal_returned,
            'tax_returned' => (float) $this->tax_returned,
            'total_returned' => (float) $this->total_returned,
            'reason' => (string) $this->reason,
            'refund_method' => (string) $this->refund_method,
            'original_payment_method' => (string) $this->original_payment_method,
            'return_type' => (string) $this->return_type,
            'cash_transaction_id' => $this->when($this->cash_transaction_id, (int) $this->cash_transaction_id),
            'items' => SalesReturnItemResource::collection($this->whenLoaded('items')),
            'sale' => new SaleResource($this->whenLoaded('sale')),
        ];
    }
}
