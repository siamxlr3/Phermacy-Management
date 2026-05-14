<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SalesReturnItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'medicine_id'      => $this->medicine_id,
            'medicine_name'    => $this->medicine->medicine_name,
            'dosage_form'      => $this->medicine->dosage_form ?? null,
            'batch_number'     => $this->batch->batch_number ?? 'N/A',
            'qty_returned'     => $this->qty_returned,
            'sale_unit'        => $this->sale_unit,
            'unit_price'       => $this->unit_price,
            'subtotal'         => $this->subtotal,
            'return_condition' => $this->return_condition,
        ];
    }
}
