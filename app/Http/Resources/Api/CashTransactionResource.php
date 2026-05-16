<?php
 
namespace App\Http\Resources\Api;
 
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
 
class CashTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (int) $this->id,
            'user_id' => (int) $this->user_id,
            'user_name' => (string) ($this->user->name ?? 'System'),
            'transaction_type' => (string) $this->transaction_type,
            'amount' => (float) $this->amount,
            'balance_after' => (float) $this->balance_after,
            'description' => (string) $this->description,
            'reference_type' => (string) $this->reference_type,
            'reference_id' => (int) $this->reference_id,
            'reference_number' => (string) $this->reference_number,
            'payment_method' => (string) $this->payment_method,
            'party_name' => (string) $this->party_name,
            'party_type' => (string) $this->party_type,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
