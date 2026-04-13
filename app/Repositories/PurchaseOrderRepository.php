<?php

namespace App\Repositories;

use App\Models\PurchaseOrder;
use Carbon\Carbon;

class PurchaseOrderRepository
{
    public function getAll(int $perPage = 10, ?string $search = null, ?string $status = null, array $dateRange = [], bool $hasNoGrn = false)
    {
        return PurchaseOrder::with(['supplier', 'items.medicine'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->whereHas('supplier', function ($sq) use ($search) {
                        $sq->where('name', 'like', "%{$search}%");
                    })
                    ->orWhere('id', 'like', "%{$search}%")
                    ->orWhere('po_number', 'like', "%{$search}%");
                });
            })
            ->when($status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when(!empty($dateRange), function ($query) use ($dateRange) {
                $query->whereBetween('order_date', $dateRange);
            })
            ->when($hasNoGrn, function ($query) {
                $query->whereDoesntHave('grns');
            })
            ->orderBy('order_date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate($perPage);
    }

    public function generatePONumber(): string
    {
        $date = now()->format('Ymd');
        $prefix = "PO-{$date}-";

        $lastPO = PurchaseOrder::where('po_number', 'like', "{$prefix}%")
            ->orderBy('po_number', 'desc')
            ->first();

        $sequence = 1;
        if ($lastPO) {
            $lastSequence = (int) substr($lastPO->po_number, -3);
            $sequence = $lastSequence + 1;
        }

        return $prefix . str_pad($sequence, 3, '0', STR_PAD_LEFT);
    }

    public function findById(int $id)
    {
        return PurchaseOrder::with(['supplier', 'items.medicine'])->findOrFail($id);
    }

    public function create(array $data)
    {
        return PurchaseOrder::create($data);
    }

    public function update(PurchaseOrder $po, array $data)
    {
        $po->update($data);
        return $po;
    }

    public function delete(PurchaseOrder $po)
    {
        return $po->delete();
    }

    public function createItem(PurchaseOrder $po, array $itemData)
    {
        return $po->items()->create($itemData);
    }

    public function deleteItems(PurchaseOrder $po)
    {
        return $po->items()->delete();
    }
}
