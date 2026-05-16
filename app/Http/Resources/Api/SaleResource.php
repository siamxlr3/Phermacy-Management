<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaleResource extends JsonResource
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
            'invoice_number' => (string) $this->invoice_number,
            'sale_date' => $this->sale_date?->toISOString(),
            'subtotal' => (float) $this->subtotal,
            'tax_total' => (float) $this->tax_total,
            'discount_total' => (float) $this->discount_total,
            'grand_total' => (float) $this->grand_total,
            'refunded_amount' => (float) ($this->refunded_amount ?? 0),
            'refunded_subtotal' => (float) ($this->refunded_subtotal ?? 0),
            'net_total' => (float) ($this->grand_total - ($this->refunded_subtotal ?? 0)),
            'paid_amount' => (float) $this->paid_amount,
            'due_amount' => (float) $this->due_amount,
            'customer_name' => (string) $this->customer_name,
            'customer_phone' => (string) $this->customer_phone,
            'payment_method' => (string) $this->payment_method,
            'status' => (string) $this->status,
            'items' => SaleItemResource::collection($this->whenLoaded('items')),
        ];
    }
}
