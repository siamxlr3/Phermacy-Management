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
            $po = PurchaseOrder::with('supplier')->findOrFail($data['purchase_order_id']);
            
            // 1. Create the GRN Header
            $grn = $this->grnRepository->create([
                'purchase_order_id' => $data['purchase_order_id'],
                'received_date' => $data['received_date'],
                'invoice_number' => $data['invoice_number'] ?? null,
                'received_by' => $data['received_by'],
                'total_amount' => $data['total_amount'],
                'notes' => $data['notes'] ?? null,
            ]);

            // 2. Process items
            foreach ($data['items'] as $item) {
                // a. Create GRN Item
                $this->grnRepository->createItem($grn, $item);

                // b. Calculate stock in smallest unit (tablets)
                $medicine = Medicine::findOrFail($item['medicine_id']);
                $stripsPerBox = $medicine->strips_per_box ?? 1;
                $tabletsPerStrip = $medicine->tablets_per_strip ?? 1;
                $totalTablets = $item['qty_boxes_received'] * $stripsPerBox * $tabletsPerStrip;

                // c. Calculate cost per tablet for stock batch
                $costPerTablet = $item['unit_cost'] / ($stripsPerBox * $tabletsPerStrip);

                // d. Create Stock Batch
                $this->batchRepository->create([
                    'medicine_id' => $item['medicine_id'],
                    'supplier_id' => $po->supplier_id,
                    'grn_id' => $grn->id,
                    'batch_number' => $item['batch_number'],
                    'expiry_date' => $item['expiry_date'],
                    'qty_tablets' => $totalTablets,
                    'qty_tablets_remaining' => $totalTablets,
                    'cost_per_tablet' => $costPerTablet,
                    'received_date' => $data['received_date'],
                ]);

                // e. Update master stock on Medicine model
                $medicine->increment('stock', $totalTablets);
                
                // f. Update Medicine cost price with the latest purchase price
                $medicine->update(['cost_price' => $item['unit_cost']]);

                // Auto-resolve any Low Stock alerts if stock is now sufficient
                $this->alertService->resolveLowStockAlert($medicine->fresh());
            }

            // 3. Update PO status to Received
            $po->update(['status' => 'Received']);

            // 4. Invalidate relevant caches
            Cache::forget('stock.aggregated');
            Cache::forget('medicines.active_list');

            return $grn->load(['purchaseOrder', 'items.medicine']);
        });
    }

    public function getGRNDetails(int $id)
    {
        return $this->grnRepository->findById($id);
    }

    /**
     * Update an existing GRN — reverses old stock and re-applies new stock.
     */
    public function updateGRN(GRN $grn, array $data): GRN
    {
        return DB::transaction(function () use ($grn, $data) {
            // 1. Reverse old stock batches
            foreach ($grn->items as $oldItem) {
                $medicine = Medicine::find($oldItem->medicine_id);
                // Remove the stock batch that was created by this GRN item
                $batch = StockBatch::where('grn_id', $grn->id)
                    ->where('medicine_id', $oldItem->medicine_id)
                    ->first();

                if ($batch) {
                    $medicine?->decrement('stock', $batch->qty_tablets);
                    $batch->delete();
                }
            }

            // 2. Delete old GRN items
            $this->grnRepository->deleteItems($grn);

            // 3. Update GRN header
            $this->grnRepository->update($grn, [
                'received_date' => $data['received_date'],
                'invoice_number' => $data['invoice_number'] ?? null,
                'received_by' => $data['received_by'],
                'total_amount' => $data['total_amount'],
                'notes' => $data['notes'] ?? null,
            ]);

            // 4. Re-insert items and re-apply stock
            $po = $grn->purchaseOrder()->with('supplier')->first();
            foreach ($data['items'] as $item) {
                $this->grnRepository->createItem($grn, $item);

                $medicine = Medicine::findOrFail($item['medicine_id']);
                $stripsPerBox = $medicine->strips_per_box ?? 1;
                $tabletsPerStrip = $medicine->tablets_per_strip ?? 1;
                $totalTablets = $item['qty_boxes_received'] * $stripsPerBox * $tabletsPerStrip;
                $costPerTablet = $item['unit_cost'] / ($stripsPerBox * $tabletsPerStrip);

                $this->batchRepository->create([
                    'medicine_id' => $item['medicine_id'],
                    'supplier_id' => $po?->supplier_id,
                    'grn_id' => $grn->id,
                    'batch_number' => $item['batch_number'],
                    'expiry_date' => $item['expiry_date'],
                    'qty_tablets' => $totalTablets,
                    'qty_tablets_remaining' => $totalTablets,
                    'cost_per_tablet' => $costPerTablet,
                    'received_date' => $data['received_date'],
                ]);

                $medicine->increment('stock', $totalTablets);
                $medicine->update(['cost_price' => $item['unit_cost']]);
                $this->alertService->resolveLowStockAlert($medicine->fresh());
            }

            Cache::forget('stock.aggregated');
            Cache::forget('medicines.active_list');

            return $grn->fresh(['purchaseOrder.supplier', 'items.medicine']);
        });
    }

    /**
     * Delete a GRN — reverses all associated stock changes.
     */
    public function deleteGRN(GRN $grn): void
    {
        DB::transaction(function () use ($grn) {
            // 1. Reverse all stock batches for this GRN
            foreach ($grn->items as $item) {
                $medicine = Medicine::find($item->medicine_id);
                $batch = StockBatch::where('grn_id', $grn->id)
                    ->where('medicine_id', $item->medicine_id)
                    ->first();

                if ($batch) {
                    $medicine?->decrement('stock', $batch->qty_tablets);
                    $batch->delete();
                }
            }

            // 2. Delete GRN items and the GRN
            $this->grnRepository->deleteItems($grn);
            $this->grnRepository->delete($grn);

            Cache::forget('stock.aggregated');
            Cache::forget('medicines.active_list');
        });
    }
}
