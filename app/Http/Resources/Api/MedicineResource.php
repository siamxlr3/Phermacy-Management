<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MedicineResource extends JsonResource
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
            'name' => $this->name,
            'generic_name' => $this->generic_name,
            'category_id' => $this->category_id,
            'category' => $this->whenLoaded('category', function () {
                return $this->category ? $this->category->name : 'N/A';
            }),
            'manufacturer_id' => $this->manufacturer_id,
            'manufacturer' => $this->whenLoaded('manufacturer', function () {
                return $this->manufacturer ? $this->manufacturer->name : 'N/A';
            }),
            'tablets_per_strip' => $this->tablets_per_strip,
            'strips_per_box' => $this->strips_per_box,
            'sale_unit' => $this->sale_unit,
            'price_per_tablet' => $this->price_per_tablet,
            'cost_price' => $this->cost_price,
            'reorder_level' => $this->reorder_level,
            // Calculate total stock conceptually for now or just generic info. 
            // The existing UI showed 'stock', which normally would come from inventory tables.
            // For now, let's map reorder_level as "stock" if we must, or return 0, since stock is usually tracked in a separate stock table.
            // Wait, we can just return what we have in the medicines table.
            'stock' => $this->stock ?? 0,
            'status' => $this->status,
        ];
    }
}
