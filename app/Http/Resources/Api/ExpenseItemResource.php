<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExpenseItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'items_name' => $this->items_name,
            'category' => $this->category,
            'qty' => $this->qty,
            'price' => $this->price,
            'total_price' => $this->total_price,
        ];
    }
}
