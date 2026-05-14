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
            'id' => $this->id,
            'sale_id' => $this->sale_id,
            'sale_invoice' => $this->sale->invoice_number,
            'return_invoice_number' => $this->return_invoice_number,
            'return_date' => $this->return_date->toDateTimeString(),
            'subtotal_returned' => $this->subtotal_returned,
            'tax_returned' => $this->tax_returned,
            'total_returned' => $this->total_returned,
            'reason' => $this->reason,
            'refund_method' => $this->refund_method,
            'original_payment_method' => $this->original_payment_method,
            'return_type' => $this->return_type,
            'cash_transaction_id' => $this->cash_transaction_id,
            'items' => SalesReturnItemResource::collection($this->whenLoaded('items')),
        ];
    }
}
