<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StockAdjustmentResource extends JsonResource
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
            'medicine_name' => $this->when($this->relationLoaded('medicine'), fn() => $this->medicine->medicine_name),
            'stock_batch_id' => $this->stock_batch_id,
            'batch_number' => $this->when($this->relationLoaded('stockBatch'), fn() => $this->stockBatch->batch_number),
            
            'adjustment' => [
                'type' => $this->adjustment_type,
                'unit' => $this->adjustment_unit,
                'qty_in_units' => $this->qty_in_units,
                'qty_change_tablets' => $this->qty_change_tablets,
            ],
            
            'snapshot' => [
                'qty_before' => $this->qty_before,
                'qty_after' => $this->qty_after,
            ],
            
            'note' => $this->note,
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at->format('Y-m-d H:i:s'),
        ];
    }
}
