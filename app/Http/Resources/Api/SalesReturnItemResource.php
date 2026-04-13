<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SalesReturnItemResource extends JsonResource
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
            'medicine_id' => $this->medicine_id,
            'medicine_name' => $this->medicine->name,
            'batch_number' => $this->batch->batch_number ?? 'N/A',
            'qty_returned' => $this->qty_returned,
            'unit_price' => $this->unit_price,
            'tax_amount' => $this->tax_amount,
            'subtotal' => $this->subtotal,
        ];
    }
}
