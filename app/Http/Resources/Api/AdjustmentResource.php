<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdjustmentResource extends JsonResource
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
            'medicine_name' => $this->medicine->name ?? 'Unknown',
            'stock_batch_id' => $this->stock_batch_id,
            'batch_number' => $this->batch->batch_number ?? 'Unknown',
            'type' => $this->type,
            'reason' => $this->reason,
            'qty_tablets_changed' => $this->qty_tablets_changed,
            'adjustment_date' => $this->adjustment_date->format('Y-m-d'),
            'user_name' => $this->user->name ?? 'System',
            'created_at' => $this->created_at->toDateTimeString(),
        ];
    }
}
