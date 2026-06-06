<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StockBatchResource extends JsonResource
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
            'medicine' => [
                'id' => (int) ($this->medicine->id ?? 0),
                'name' => (string) ($this->medicine->medicine_name ?? 'N/A'),
                'medicine_name' => (string) ($this->medicine->medicine_name ?? 'N/A'),
            ],
            // Keep root fields for legacy frontend support but use loaded relations
            'medicine_name' => (string) ($this->medicine->medicine_name ?? 'N/A'),
            'supplier_name' => (string) ($this->supplier->name ?? 'N/A'),
            
            'tablets_per_strip' => (int) ($this->medicine->tablets_per_strip ?? 0),
            'strips_per_box' => (int) ($this->medicine->strips_per_box ?? 0),
            'sale_unit_label' => (string) ($this->medicine->sale_unit_label ?? ''),
            
            'supplier_id' => (int) $this->supplier_id,
            'supplier' => [
                'id' => (int) ($this->supplier->id ?? 0),
                'name' => (string) ($this->supplier->name ?? 'N/A'),
            ],
            
            'grn_id' => $this->grn_id ? (int) $this->grn_id : null,
            'dosage_form_snapshot' => (string) $this->dosage_form_snapshot,
            'batch_number' => (string) $this->batch_number,
            'expiry_date' => $this->expiry_date?->format('Y-m-d'),
            'received_date' => $this->received_date?->format('Y-m-d'),
            
            'qty_tablets' => (float) $this->qty_tablets,
            'qty_tablets_remaining' => (float) $this->qty_tablets_remaining,
            'qty_boxes' => (float) $this->qty_boxes,
            'qty_boxes_remaining' => (float) $this->qty_boxes_remaining,
            'qty_units' => $this->qty_units ? (float) $this->qty_units : null,
            'qty_units_remaining' => $this->qty_units_remaining ? (float) $this->qty_units_remaining : null,
            
            'cost_per_unit' => (float) $this->cost_per_unit,
            'cost_per_stripe' => $this->cost_per_stripe ? (float) $this->cost_per_stripe : null,
            'cost_per_box' => $this->cost_per_box ? (float) $this->cost_per_box : null,
            'total_cost_value' => (float) $this->total_cost_value,
            
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
