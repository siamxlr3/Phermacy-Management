<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaleItemResource extends JsonResource
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
            'medicine_id' => (int) $this->medicine_id,
            'medicine_name' => (string) ($this->medicine->medicine_name ?? 'Unknown'),
            'category' => (string) ($this->medicine->category ?? 'N/A'),
            'sale_unit' => (string) $this->sale_unit,
            'dosage_form' => (string) ($this->medicine->dosage_form ?? 'N/A'),
            'batch_number' => (string) ($this->batch->batch_number ?? 'N/A'),
            'qty_tablets' => (int) $this->qty_tablets,
            'sale_qty' => (float) $this->sale_qty,
            'tablets_per_strip' => (int) ($this->medicine->tablets_per_strip ?? 1),
            'strips_per_box' => (int) ($this->medicine->strips_per_box ?? 1),
            'unit_price' => (float) $this->unit_price,
            'tax_amount' => (float) $this->tax_amount,
            'subtotal' => (float) $this->subtotal,
            'returned_qty_tablets' => (int) ($this->returnItems->sum('qty_returned') ?? 0),
        ];
    }
}
