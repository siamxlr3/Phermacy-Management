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
            'id' => $this->id,
            'medicine_id' => $this->medicine_id,
            'medicine_name' => $this->medicine->medicine_name,
            'sale_unit' => $this->sale_unit,
            'dosage_form' => $this->medicine->dosage_form,
            'batch_number' => $this->batch->batch_number ?? 'N/A',
            'qty_tablets' => $this->qty_tablets,
            'sale_qty' => $this->sale_qty,
            'tablets_per_strip' => $this->medicine->tablets_per_strip ?? 1,
            'strips_per_box' => $this->medicine->strips_per_box ?? 1,
            'unit_price' => $this->unit_price,
            'tax_amount' => $this->tax_amount,
            'subtotal' => $this->subtotal,
        ];
    }
}
