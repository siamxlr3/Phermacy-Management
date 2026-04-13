<?php

namespace App\Services;

use App\Models\PurchaseOrder;
use App\Models\Medicine;
use App\Repositories\PurchaseOrderRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class PurchaseOrderService
{
    protected $poRepository;

    public function __construct(PurchaseOrderRepository $poRepository)
    {
        $this->poRepository = $poRepository;
    }

    public function getAllOrders(int $perPage = 10, ?string $search = null, ?string $status = null, ?string $fromDate = null, ?string $toDate = null, bool $hasNoGrn = false)
    {
        $dateRange = [];
        if ($fromDate && $toDate) {
            $dateRange = [$fromDate, $toDate];
        }
        
        return $this->poRepository->getAll($perPage, $search, $status, $dateRange, $hasNoGrn);
    }

    public function getOrderDetails(int $id)
    {
        return $this->poRepository->findById($id);
    }

    public function createOrder(array $data)
    {
        return DB::transaction(function () use ($data) {
            $items = $data['items'];
            $totalAmount = 0;

            // 1. Calculate totals
            foreach ($items as &$item) {
                $item['subtotal'] = $item['qty_boxes'] * $item['unit_cost'];
                $totalAmount += $item['subtotal'];
            }

            // 2. Create the main Purchase Order
            $poData = [
                'po_number' => $this->poRepository->generatePONumber(),
                'supplier_id' => $data['supplier_id'],
                'order_date' => $data['order_date'],
                'notes' => $data['notes'] ?? null,
                'total_amount' => $totalAmount,
                'status' => 'Pending'
            ];
            $po = $this->poRepository->create($poData);

            // 3. Create items and potentially update Medicine cost
            foreach ($items as $item) {
                $this->poRepository->createItem($po, $item);
                
                // Update cost_price on Medicine model if it's a new price
                $medicine = Medicine::find($item['medicine_id']);
                if ($medicine && $medicine->cost_price != $item['unit_cost']) {
                    $medicine->update(['cost_price' => $item['unit_cost']]);
                }
            }

            return $po->load(['supplier', 'items.medicine']);
        });
    }

    public function updateOrder(PurchaseOrder $po, array $data)
    {
        return DB::transaction(function () use ($po, $data) {
            $items = $data['items'];
            $totalAmount = 0;

            // 1. Calculate totals
            foreach ($items as &$item) {
                $item['subtotal'] = $item['qty_boxes'] * $item['unit_cost'];
                $totalAmount += $item['subtotal'];
            }

            // 2. Update the main Purchase Order
            $poData = [
                'supplier_id' => $data['supplier_id'],
                'order_date' => $data['order_date'],
                'notes' => $data['notes'] ?? null,
                'total_amount' => $totalAmount,
            ];
            $this->poRepository->update($po, $poData);

            // 3. Clear old items and insert new ones
            $this->poRepository->deleteItems($po);
            foreach ($items as $item) {
                $this->poRepository->createItem($po, $item);
                
                // Update cost_price on Medicine model if it's a new price
                $medicine = Medicine::find($item['medicine_id']);
                if ($medicine && $medicine->cost_price != $item['unit_cost']) {
                    $medicine->update(['cost_price' => $item['unit_cost']]);
                }
            }

            return $po->fresh(['supplier', 'items.medicine']);
        });
    }

    public function updateOrderStatus(PurchaseOrder $po, string $status)
    {
        return DB::transaction(function () use ($po, $status) {
            $po->update(['status' => $status]);
            return $po;
        });
    }

    public function deleteOrder(PurchaseOrder $po)
    {
        return DB::transaction(function () use ($po) {
            $this->poRepository->deleteItems($po);
            return $this->poRepository->delete($po);
        });
    }
}
