<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExpenseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'transaction_id' => $this->transaction_id,
            'supplier_name' => $this->supplier_name,
            'contact_person' => $this->contact_person,
            'phone' => $this->phone,
            'address' => $this->address,
            'expense_date' => $this->expense_date ? $this->expense_date->format('Y-m-d') : null,
            'grand_total' => $this->grand_total,
            'status' => $this->status,
            'items' => ExpenseItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at ? $this->created_at->format('Y-m-d H:i:s') : null,
        ];
    }
}
