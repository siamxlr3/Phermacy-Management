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
            'id' => $this->id,
            'invoice_number' => $this->invoice_number,
            'sale_date' => $this->sale_date->toDateTimeString(),
            'subtotal' => $this->subtotal,
            'tax_total' => $this->tax_total,
            'discount_total' => $this->discount_total,
            'grand_total' => $this->grand_total,
            'paid_amount' => $this->paid_amount,
            'due_amount' => $this->due_amount,
            'customer_name' => $this->customer_name,
            'customer_phone' => $this->customer_phone,
            'payment_method' => $this->payment_method,
            'status' => $this->status,
            'items' => SaleItemResource::collection($this->whenLoaded('items')),
        ];
    }
}
