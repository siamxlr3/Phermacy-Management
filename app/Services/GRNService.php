<?php

namespace App\Services;

use App\Models\GRN;
use App\Models\Medicine;
use App\Models\PurchaseOrder;
use App\Models\StockBatch;
use App\Repositories\GRNRepository;
use App\Repositories\BatchRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class GRNService
{
    protected $grnRepository;
    protected $batchRepository;
    protected $alertService;

    public function __construct(GRNRepository $grnRepository, BatchRepository $batchRepository, AlertService $alertService)
    {
        $this->grnRepository = $grnRepository;
        $this->batchRepository = $batchRepository;
        $this->alertService = $alertService;
    }

    public function getAllGRNs(int $perPage = 10, ?string $search = null, ?string $fromDate = null, ?string $toDate = null)
    {
        $dateRange = [];
        if ($fromDate && $toDate) {
            $dateRange = [$fromDate, $toDate];
        }
        return $this->grnRepository->getAll($perPage, $search, $dateRange);
    }

    public function createGRN(array $data)
    {
        return DB::transaction(function () use ($data) {
            // Auto-generate Purchase Order if one wasn't linked
            if (empty($data['purchase_order_id'])) {
                $po = PurchaseOrder::create([
                    'supplier_id' => $data['supplier_id'],
                    'order_date' => $data['received_date'],
                    'status' => 'Received',
                    'payment_status' => $data['payment_status'] ?? 'Due',
                    'total_amount' => $data['total_amount'],
                    'paid_amount' => $data['paid_amount'] ?? 0,
                    'notes' => 'Auto-generated from GRN',
                ]);
                
                foreach ($data['items'] as $item) {
                    $medicine = Medicine::find($item['medicine_id']);
                    $isGroupA = in_array($medicine->dosage_form, ['Tablet', 'Capsule', 'Suppository', 'Patch']);
                    
                    \App\Models\PurchaseOrderItem::create([
                        'purchase_order_id' => $po->id,
                        'medicine_id' => $item['medicine_id'],
                        'qty_boxes' => $item['qty_boxes_received'],
                        'unit_cost' => $isGroupA ? ($item['cost_per_box'] ?? 0) : ($item['price'] ?? 0),
                        'subtotal' => $item['subtotal'],
                    ]);
                }
                
                $data['purchase_order_id'] = $po->id;
            }

            // 1. Create the GRN Header
            $grn = $this->grnRepository->create([
                'purchase_order_id' => $data['purchase_order_id'] ?? null,
                'supplier_id' => $data['supplier_id'],
                'received_date' => $data['received_date'],
                'invoice_number' => $data['invoice_number'] ?? null,
                'received_by' => $data['received_by'] ?? null,
                'total_amount' => $data['total_amount'],
                'paid_amount' => $data['paid_amount'] ?? 0,
                'payment_status' => $data['payment_status'] ?? 'Due',
                'notes' => $data['notes'] ?? null,
            ]);

            // 2. Process items
            foreach ($data['items'] as $item) {
                $medicine = Medicine::findOrFail($item['medicine_id']);
                $isGroupA = in_array($medicine->dosage_form, ['Tablet', 'Capsule', 'Suppository', 'Patch']);

                // a. Create GRN Item
                $this->grnRepository->createItem($grn, [
                    'medicine_id' => $item['medicine_id'],
                    'batch_number' => $item['batch_number'],
                    'expiry_date' => $item['expiry_date'],
                    'qty_boxes_received' => $item['qty_boxes_received'],
                    'subtotal' => $item['subtotal'],
                    // Group A fields
                    'cost_per_box' => $isGroupA ? ($item['cost_per_box'] ?? null) : null,
                    'cost_per_stripe' => $isGroupA ? ($item['cost_per_stripe'] ?? null) : null,
                    'cost_per_tablet' => $isGroupA ? ($item['cost_per_tablet'] ?? null) : null,
                    'strength' => $item['strength'] ?? $medicine->strength,
                    // Group B fields
                    'volume' => !$isGroupA ? ($item['volume'] ?? $medicine->volume) : null,
                    'price' => !$isGroupA ? ($item['price'] ?? null) : null,
                ]);

                // b. Calculate stock in smallest units
                $totalUnits = 0;
                if ($isGroupA) {
                    $tabletsPerBox = ($medicine->tablet_per_stripe ?? 1) * ($medicine->stripe_per_box ?? 1);
                    $totalUnits = $item['qty_boxes_received'] * $tabletsPerBox;
                } else {
                    $totalUnits = $item['qty_boxes_received']; // For liquids, boxes_received acts as unit count
                }

                // c. Create Stock Batch
                $this->batchRepository->create([
                    'medicine_id' => $item['medicine_id'],
                    'supplier_id' => $data['supplier_id'],
                    'grn_id' => $grn->id,
                    'batch_number' => $item['batch_number'],
                    'expiry_date' => $item['expiry_date'],
                    'qty_tablets' => $totalUnits,
                    'qty_tablets_remaining' => $totalUnits,
                    'received_date' => $data['received_date'],
                    // Costs
                    'cost_per_tablet' => $isGroupA ? ($item['cost_per_tablet'] ?? null) : null,
                    'cost_per_stripe' => $isGroupA ? ($item['cost_per_stripe'] ?? null) : null,
                    'cost_per_box' => $isGroupA ? ($item['cost_per_box'] ?? null) : null,
                    'volume' => !$isGroupA ? ($item['volume'] ?? $medicine->volume) : null,
                    'price' => !$isGroupA ? ($item['price'] ?? null) : null,
                ]);

                // d. Update master stock on Medicine model
                $medicine->increment('stock', $totalUnits);
                
                // e. Update Medicine cost price (latest purchase price)
                if ($isGroupA) {
                    $medicine->update(['price_per_tablet' => $item['cost_per_tablet'] ?? $medicine->price_per_tablet]);
                } else {
                    $medicine->update(['price' => $item['price'] ?? $medicine->price]);
                }

                $this->alertService->resolveLowStockAlert($medicine->fresh());
            }

            // 3. Update PO status if applicable (if it was an existing PO)
            if (!empty($data['purchase_order_id'])) {
                $po = PurchaseOrder::find($data['purchase_order_id']);
                if ($po && $po->status !== 'Received') {
                    $po->update(['status' => 'Received']);
                }
            }

            Cache::forget('stock.aggregated');
            Cache::forget('medicines.active_list');

            return $grn->load(['supplier', 'purchaseOrder', 'items.medicine']);
        });
    }

    public function updateGRN(GRN $grn, array $data): GRN
    {
        return DB::transaction(function () use ($grn, $data) {
            // 1. Reverse old stock
            foreach ($grn->items as $oldItem) {
                $medicine = Medicine::find($oldItem->medicine_id);
                $batch = StockBatch::where('grn_id', $grn->id)
                    ->where('medicine_id', $oldItem->medicine_id)
                    ->first();

                if ($batch) {
                    // Cascade delete related records to satisfy FK constraints
                    DB::table('stock_adjustments')->where('stock_batch_id', $batch->id)->delete();
                    DB::table('alerts')->where('stock_batch_id', $batch->id)->delete();
                    DB::table('sale_items')->where('stock_batch_id', $batch->id)->delete();
                    DB::table('sales_return_items')->where('stock_batch_id', $batch->id)->delete();
                    
                    // Only decrement what is currently remaining from this batch
                    $medicine?->decrement('stock', $batch->qty_tablets_remaining);
                    $batch->delete();
                }
            }

            $this->grnRepository->deleteItems($grn);

            // 2. Update GRN header
            $this->grnRepository->update($grn, [
                'purchase_order_id' => $data['purchase_order_id'] ?? $grn->purchase_order_id,
                'supplier_id' => $data['supplier_id'] ?? $grn->supplier_id,
                'received_date' => $data['received_date'],
                'invoice_number' => $data['invoice_number'] ?? null,
                'received_by' => $data['received_by'] ?? null,
                'total_amount' => $data['total_amount'],
                'paid_amount' => $data['paid_amount'] ?? 0,
                'payment_status' => $data['payment_status'] ?? 'Due',
                'notes' => $data['notes'] ?? null,
            ]);

            // 3. Re-insert items and re-apply stock
            foreach ($data['items'] as $item) {
                $medicine = Medicine::findOrFail($item['medicine_id']);
                $isGroupA = in_array($medicine->dosage_form, ['Tablet', 'Capsule', 'Suppository', 'Patch']);

                $this->grnRepository->createItem($grn, [
                    'medicine_id' => $item['medicine_id'],
                    'batch_number' => $item['batch_number'],
                    'expiry_date' => $item['expiry_date'],
                    'qty_boxes_received' => $item['qty_boxes_received'],
                    'subtotal' => $item['subtotal'],
                    'cost_per_box' => $isGroupA ? ($item['cost_per_box'] ?? null) : null,
                    'cost_per_stripe' => $isGroupA ? ($item['cost_per_stripe'] ?? null) : null,
                    'cost_per_tablet' => $isGroupA ? ($item['cost_per_tablet'] ?? null) : null,
                    'strength' => $item['strength'] ?? $medicine->strength,
                    'volume' => !$isGroupA ? ($item['volume'] ?? $medicine->volume) : null,
                    'price' => !$isGroupA ? ($item['price'] ?? null) : null,
                ]);

                $totalUnits = 0;
                if ($isGroupA) {
                    $tabletsPerBox = ($medicine->tablet_per_stripe ?? 1) * ($medicine->stripe_per_box ?? 1);
                    $totalUnits = $item['qty_boxes_received'] * $tabletsPerBox;
                } else {
                    $totalUnits = $item['qty_boxes_received'];
                }

                $this->batchRepository->create([
                    'medicine_id' => $item['medicine_id'],
                    'supplier_id' => $data['supplier_id'] ?? $grn->supplier_id,
                    'grn_id' => $grn->id,
                    'batch_number' => $item['batch_number'],
                    'expiry_date' => $item['expiry_date'],
                    'qty_tablets' => $totalUnits,
                    'qty_tablets_remaining' => $totalUnits,
                    'received_date' => $data['received_date'],
                    'cost_per_tablet' => $isGroupA ? ($item['cost_per_tablet'] ?? null) : null,
                    'cost_per_stripe' => $isGroupA ? ($item['cost_per_stripe'] ?? null) : null,
                    'cost_per_box' => $isGroupA ? ($item['cost_per_box'] ?? null) : null,
                    'volume' => !$isGroupA ? ($item['volume'] ?? $medicine->volume) : null,
                    'price' => !$isGroupA ? ($item['price'] ?? null) : null,
                ]);

                $medicine->increment('stock', $totalUnits);
                if ($isGroupA) {
                    $medicine->update(['price_per_tablet' => $item['cost_per_tablet'] ?? $medicine->price_per_tablet]);
                } else {
                    $medicine->update(['price' => $item['price'] ?? $medicine->price]);
                }
                $this->alertService->resolveLowStockAlert($medicine->fresh());
            }

            // 4. Sync with Purchase Order
            if ($grn->purchase_order_id) {
                $po = PurchaseOrder::find($grn->purchase_order_id);
                if ($po) {
                    $po->update([
                        'supplier_id' => $data['supplier_id'] ?? $grn->supplier_id,
                        'order_date' => $data['received_date'],
                        'total_amount' => $data['total_amount'],
                        'paid_amount' => $data['paid_amount'] ?? 0,
                        'payment_status' => $data['payment_status'] ?? 'Due',
                    ]);

                    // Sync PO items
                    $po->items()->delete();
                    foreach ($data['items'] as $item) {
                        $medicine = Medicine::find($item['medicine_id']);
                        $isGroupA = in_array($medicine->dosage_form, ['Tablet', 'Capsule', 'Suppository', 'Patch']);
                        
                        \App\Models\PurchaseOrderItem::create([
                            'purchase_order_id' => $po->id,
                            'medicine_id' => $item['medicine_id'],
                            'qty_boxes' => $item['qty_boxes_received'],
                            'unit_cost' => $isGroupA ? ($item['cost_per_box'] ?? 0) : ($item['price'] ?? 0),
                            'subtotal' => $item['subtotal'],
                        ]);
                    }
                }
            }

            Cache::forget('stock.aggregated');
            Cache::forget('medicines.active_list');

            return $grn->fresh(['supplier', 'purchaseOrder', 'items.medicine']);
        });
    }

    public function deleteGRN(GRN $grn): void
    {
        DB::transaction(function () use ($grn) {
            foreach ($grn->items as $item) {
                $medicine = Medicine::find($item->medicine_id);
                $batch = StockBatch::where('grn_id', $grn->id)
                    ->where('medicine_id', $item->medicine_id)
                    ->first();

                if ($batch) {
                    // Cascade delete related records to satisfy FK constraints
                    DB::table('stock_adjustments')->where('stock_batch_id', $batch->id)->delete();
                    DB::table('alerts')->where('stock_batch_id', $batch->id)->delete();
                    DB::table('sale_items')->where('stock_batch_id', $batch->id)->delete();
                    DB::table('sales_return_items')->where('stock_batch_id', $batch->id)->delete();

                    // Only decrement what is currently remaining from this batch
                    $medicine?->decrement('stock', $batch->qty_tablets_remaining);
                    $batch->delete();
                }
            }

            $this->grnRepository->deleteItems($grn);
            
            // Sync delete Purchase Order
            $poId = $grn->purchase_order_id;
            
            $this->grnRepository->delete($grn);

            if ($poId) {
                $po = PurchaseOrder::find($poId);
                if ($po) {
                    $po->delete();
                }
            }

            Cache::forget('stock.aggregated');
            Cache::forget('medicines.active_list');
        });
    }

    public function getGRNDetails(int $id)
    {
        return $this->grnRepository->findById($id);
    }
}
