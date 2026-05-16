<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SalesReturnItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $medicine = $this->medicine;
        $qty = (float) $this->qty_returned;

        if ($this->sale_unit === 'Box') {
            $tabletsPerBox = (int) (($medicine->tablets_per_strip ?? 1) * ($medicine->strips_per_box ?? 1));
            $qty = $qty / ($tabletsPerBox > 0 ? $tabletsPerBox : 1);
        } elseif ($this->sale_unit === 'Strip') {
            $tabletsPerStrip = (int) ($medicine->tablets_per_strip ?? 1);
            $qty = $qty / ($tabletsPerStrip > 0 ? $tabletsPerStrip : 1);
        }

        return [
            'id'               => (int) $this->id,
            'medicine_id'      => (int) $this->medicine_id,
            'medicine_name'    => (string) ($medicine->medicine_name ?? 'Unknown'),
            'dosage_form'      => (string) ($medicine->dosage_form ?? 'N/A'),
            'batch_number'     => (string) ($this->batch->batch_number ?? 'N/A'),
            'qty_returned'     => (float) $qty, // Now in sale units
            'sale_unit'        => (string) $this->sale_unit,
            'unit_price'       => (float) $this->unit_price,
            'subtotal'         => (float) $this->subtotal,
            'return_condition' => (string) $this->return_condition,
        ];
    }
}
