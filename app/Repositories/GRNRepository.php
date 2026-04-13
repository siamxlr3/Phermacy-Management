<?php

namespace App\Repositories;

use App\Models\GRN;
use App\Models\GRNItem;

class GRNRepository
{
    public function getAll(int $perPage = 10, ?string $search = null, ?array $dateRange = [])
    {
        $query = GRN::with(['purchaseOrder.supplier', 'items.medicine']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhereHas('purchaseOrder.supplier', function ($sq) use ($search) {
                      $sq->where('name', 'like', "%{$search}%");
                  })
                  ->orWhereHas('items', function ($iq) use ($search) {
                      $iq->where('batch_number', 'like', "%{$search}%");
                  });
            });
        }

        if (!empty($dateRange)) {
            $query->whereBetween('received_date', $dateRange);
        }

        return $query->orderBy('received_date', 'desc')->paginate($perPage);
    }

    public function findById(int $id)
    {
        return GRN::with(['purchaseOrder.supplier', 'items.medicine'])->findOrFail($id);
    }

    public function create(array $data)
    {
        return GRN::create($data);
    }

    public function createItem(GRN $grn, array $data)
    {
        return $grn->items()->create($data);
    }

    public function update(GRN $grn, array $data): GRN
    {
        $grn->update($data);
        return $grn;
    }

    public function deleteItems(GRN $grn): void
    {
        $grn->items()->delete();
    }

    public function delete(GRN $grn): bool
    {
        return $grn->delete();
    }
}
