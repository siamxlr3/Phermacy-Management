<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SalesReturnItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var \App\Models\SalesReturnItem $this */
        $medicine = $this->medicine;
        
        $displayQty = (float) $this->qty_returned;
        if ($medicine) {
            $displayQty = $medicine->convertFromTablets((int) $this->qty_returned, $this->sale_unit ?? 'unit');
        }

        return [
            'id'               => (int) $this->id,
            'medicine_id'      => (int) $this->medicine_id,
            'medicine_name'    => (string) ($medicine->medicine_name ?? 'Unknown'),
            'dosage_form'      => (string) ($medicine->dosage_form ?? 'N/A'),
            'batch_number'     => (string) ($this->batch->batch_number ?? 'N/A'),
            'qty_returned'     => $displayQty,
            'sale_unit'        => (string) ($this->sale_unit ?? 'unit'),
            'unit_price'       => (float) $this->unit_price,
            'subtotal'         => (float) $this->subtotal,
            'return_condition' => (string) $this->return_condition,
        ];
    }
}
