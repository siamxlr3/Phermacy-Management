<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GRN;
use App\Models\GRNItem;
use App\Models\Medicine;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\StockBatch;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use App\Http\Resources\Api\GRNResource;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use App\Http\Requests\Api\GRNRequest;
use App\Models\CashTransaction;
use App\Models\SaleItem;
use App\Models\SalesReturnItem;
use App\Models\StockAdjustment;
use Illuminate\Support\Facades\Auth;

class GRNController extends Controller
{
    /**
     * List GRNs with optimized joins and pagination.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = $request->integer('per_page', 10);
        $search = $request->get('search');
        $fromDate = $request->get('from_date');
        $toDate = $request->get('to_date');

        $query = GRN::with(['supplier:id,name', 'purchaseOrder:id', 'items.medicine:id,medicine_name']);

        if ($search) {
            // Optimized join to utilize supplier index
            $query->join('suppliers', 'grns.supplier_id', '=', 'suppliers.id')
                  ->where(function($q) use ($search) {
                      $q->where('grns.invoice_number', 'like', "{$search}%")
                        ->orWhere('suppliers.name', 'like', "{$search}%")
                        ->orWhereExists(function ($subquery) use ($search) {
                            $subquery->select(DB::raw(1))
                                     ->from('grn_items')
                                     ->whereColumn('grn_items.grn_id', 'grns.id')
                                     ->where('batch_number', 'like', "{$search}%");
                        });
                  })
                  ->select('grns.*');
        } else {
            $query->select('grns.*');
        }

        if ($fromDate && $toDate) {
            $query->whereBetween('received_date', [$fromDate, $toDate]);
        }

        $grns = $query->orderBy('received_date', 'desc')->orderBy('id', 'desc')->paginate($perPage);
        return GRNResource::collection($grns);
    }

    /**
     * Store a new GRN and update inventory.
     */
    public function store(GRNRequest $request): JsonResponse
    {
        $data = $request->validated();

        try {
            $grn = DB::transaction(function () use ($data) {
                // Pre-fetch medicines to avoid redundant queries in loops
                $medicineIds = collect($data['items'])->pluck('medicine_id')->unique();
                $medicines = Medicine::whereIn('id', $medicineIds)
                    ->select(['id', 'stock', 'tablets_per_strip', 'strips_per_box'])
                    ->get()
                    ->keyBy('id');

                // 1. Auto-generate PO if missing (Procurement sync)
                if (empty($data['purchase_order_id'])) {
                    $po = PurchaseOrder::create([
                        'supplier_id' => $data['supplier_id'],
                        'order_date' => $data['received_date'],
                        'status' => 'Received',
                        'payment_status' => $data['payment_status'] ?? GRN::STATUS_DUE,
                        'total_amount' => $data['total_amount'],
                        'paid_amount' => $data['paid_amount'] ?? 0,
                        'notes' => 'Auto-generated from GRN',
                    ]);

                    $poItemsData = [];
                    foreach ($data['items'] as $item) {
                        $poItemsData[] = [
                            'purchase_order_id' => $po->id,
                            'medicine_id' => $item['medicine_id'],
                            'dosage_form_snapshot' => $item['dosage_form_snapshot'],
                            'qty_boxes' => $item['qty_boxes_received'],
                            'cost_per_box' => $item['cost_per_box'] ?? $item['cost_per_unit'],
                            'cost_per_unit' => $item['cost_per_unit'],
                            'cost_per_stripe' => $item['cost_per_stripe'] ?? null,
                            'subtotal' => $item['subtotal'],
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                    }
                    PurchaseOrderItem::insert($poItemsData);
                    $data['purchase_order_id'] = $po->id;
                }

                // 2. Generate Invoice Number safely with Lock
                $invoiceNumber = $data['invoice_number'] ?? null;
                if (empty($invoiceNumber)) {
                    // Optimized lock-scan for invoice generation
                    $lastGRN = DB::table('grns')
                        ->where('invoice_number', 'LIKE', 'GRN-%')
                        ->lockForUpdate()
                        ->latest('id')
                        ->first(['invoice_number']);

                    $number = 1;
                    if ($lastGRN && $lastGRN->invoice_number) {
                        preg_match('/(\d+)/', $lastGRN->invoice_number, $matches);
                        if (!empty($matches)) {
                            $number = (int) $matches[0] + 1;
                        }
                    }
                    $invoiceNumber = 'GRN-' . str_pad($number, 6, '0', STR_PAD_LEFT);
                }

                // 3. Create GRN
                $grn = GRN::create([
                    'purchase_order_id' => $data['purchase_order_id'],
                    'supplier_id' => $data['supplier_id'],
                    'received_date' => $data['received_date'],
                    'invoice_number' => $invoiceNumber,
                    'received_by' => $data['received_by'] ?? null,
                    'total_amount' => $data['total_amount'],
                    'paid_amount' => $data['paid_amount'] ?? 0,
                    'payment_status' => $data['payment_status'] ?? GRN::STATUS_DUE,
                    'notes' => $data['notes'] ?? null,
                ]);

                // 4. Process items and update stock
                $grnItemsData = [];
                $stockBatchesData = [];
                $stockIncrements = [];

                foreach ($data['items'] as $item) {
                    $medicine = $medicines->get($item['medicine_id']);
                    $batchNumber = $item['batch_number'] ?? 'BAT-' . strtoupper(substr(uniqid(), -6));
                    
                    $grnItemsData[] = [
                        'grn_id' => $grn->id,
                        'medicine_id' => $item['medicine_id'],
                        'dosage_form_snapshot' => $item['dosage_form_snapshot'],
                        'batch_number' => $batchNumber,
                        'expiry_date' => $item['expiry_date'],
                        'qty_boxes_received' => $item['qty_boxes_received'],
                        'qty_units_received' => $item['qty_units_received'] ?? null,
                        'package_size' => $item['package_size'] ?? null,
                        'cost_per_box' => $item['cost_per_box'] ?? null,
                        'cost_per_stripe' => $item['cost_per_stripe'] ?? null,
                        'cost_per_unit' => $item['cost_per_unit'] ?? null,
                        'subtotal' => $item['subtotal'] ?? 0,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];

                    $isGroupA = in_array($item['dosage_form_snapshot'], ['Tablet', 'Capsule', 'Suppository', 'Sachet']);
                    $totalTablets = $isGroupA 
                        ? $item['qty_boxes_received'] * (($medicine?->tablets_per_strip ?? 1) * ($medicine?->strips_per_box ?? 1))
                        : $item['qty_boxes_received'] * ($item['qty_units_received'] ?? 1);

                    // Use the exact subtotal from the request to ensure consistency
                    // between the GRN total amount and the inventory valuation.
                    $totalCostValue = (float) ($item['subtotal'] ?? 0);

                    $stockBatchesData[] = [
                        'medicine_id' => $item['medicine_id'],
                        'supplier_id' => $data['supplier_id'],
                        'grn_id' => $grn->id,
                        'dosage_form_snapshot' => $item['dosage_form_snapshot'],
                        'batch_number' => $batchNumber,
                        'expiry_date' => $item['expiry_date'],
                        'qty_tablets' => $totalTablets,
                        'qty_tablets_remaining' => $totalTablets,
                        'qty_boxes' => $item['qty_boxes_received'],
                        'qty_boxes_remaining' => $item['qty_boxes_received'],
                        'qty_units' => $isGroupA ? null : $totalTablets,
                        'qty_units_remaining' => $isGroupA ? null : $totalTablets,
                        'cost_per_unit' => $item['cost_per_unit'],
                        'cost_per_stripe' => $item['cost_per_stripe'] ?? null,
                        'cost_per_box' => $item['cost_per_box'] ?? null,
                        'total_cost_value' => $totalCostValue,
                        'ingested_total_cost_value' => $totalCostValue,
                        'received_date' => $data['received_date'],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];

                    // Accumulate increments to execute outside loop
                    if (!isset($stockIncrements[$item['medicine_id']])) {
                        $stockIncrements[$item['medicine_id']] = 0;
                    }
                    $stockIncrements[$item['medicine_id']] += $totalTablets;
                }

                GRNItem::insert($grnItemsData);
                StockBatch::insert($stockBatchesData);

                // Batched incremental updates to avoid per-item queries
                foreach ($stockIncrements as $medicineId => $increment) {
                    Medicine::where('id', $medicineId)->increment('stock', $increment);
                }

                if (!empty($data['purchase_order_id'])) {
                    PurchaseOrder::where('id', $data['purchase_order_id'])->update([
                        'status' => 'Received',
                        'paid_amount' => $data['paid_amount'] ?? 0,
                        'payment_status' => $data['payment_status'] ?? GRN::STATUS_DUE,
                    ]);
                }

                $grn->load('supplier');

                // Record Cash Transaction for any payment made (Regardless of full/partial)
                if ($grn->paid_amount > 0) {
                    CashTransaction::record(
                        'grn_payment',
                        $grn->paid_amount,
                        "Payment for GRN Invoice {$invoiceNumber}",
                        'grn',
                        $grn->id,
                        $invoiceNumber,
                        'cash',
                        $grn->supplier?->name,
                        'supplier',
                        Auth::id()
                    );
                }

                $this->clearCache();
                return $grn;
            });

            return response()->json([
                'success' => true,
                'message' => 'GRN created successfully',
                'data' => new GRNResource($grn->load(['supplier', 'purchaseOrder', 'items.medicine']))
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public function show(GRN $grn): GRNResource
    {
        return new GRNResource($grn->load(['supplier', 'purchaseOrder', 'items.medicine']));
    }

    /**
     * Update an existing GRN. Implements safety checks against active sales.
     */
    public function update(GRNRequest $request, GRN $grn): JsonResponse
    {
        $data = $request->validated();

        try {
            $grn = DB::transaction(function () use ($grn, $data) {
                // Lock the GRN record
                $grn = GRN::where('id', $grn->id)->lockForUpdate()->first();
                
                $oldPaidAmount    = (float) $grn->paid_amount;
                $oldSupplierId    = $grn->supplier_id;

                // 1. Update GRN Metadata
                $grn->update([
                    'purchase_order_id' => $data['purchase_order_id'] ?? $grn->purchase_order_id,
                    'supplier_id' => $data['supplier_id'] ?? $grn->supplier_id,
                    'received_date' => $data['received_date'],
                    'invoice_number' => $data['invoice_number'] ?? $grn->invoice_number,
                    'received_by' => $data['received_by'] ?? $grn->received_by,
                    'total_amount' => $data['total_amount'],
                    'paid_amount' => $data['paid_amount'] ?? 0,
                    'payment_status' => $data['payment_status'] ?? GRN::STATUS_DUE,
                    'notes' => $data['notes'] ?? null,
                ]);

                // 2. Sync Items
                $existingItemsIds = $grn->items()->pluck('id')->toArray();
                $incomingItems = collect($data['items']);
                $incomingItemsIds = $incomingItems->pluck('id')->filter()->toArray();

                // Items to Delete
                $toDeleteIds = array_diff($existingItemsIds, $incomingItemsIds);
                foreach ($toDeleteIds as $id) {
                    $item = GRNItem::find($id);
                    $batch = StockBatch::where('grn_id', $grn->id)
                        ->where('medicine_id', $item->medicine_id)
                        ->where('batch_number', $item->batch_number)
                        ->first();

                    if ($batch) {
                        $this->validateNoMovements($batch);
                        // Reverse Stock
                        Medicine::where('id', $batch->medicine_id)->decrement('stock', $batch->qty_tablets_remaining);
                        $batch->forceDelete();
                    }
                    $item->forceDelete();
                }

                // Process Update or Create
                foreach ($incomingItems as $index => $itemData) {
                    $medicine = Medicine::find($itemData['medicine_id']);
                    $isGroupA = in_array($itemData['dosage_form_snapshot'], ['Tablet', 'Capsule', 'Suppository', 'Sachet']);
                    
                    $totalTablets = $isGroupA 
                        ? $itemData['qty_boxes_received'] * (($medicine?->tablets_per_strip ?? 1) * ($medicine?->strips_per_box ?? 1))
                        : $itemData['qty_boxes_received'] * ($itemData['qty_units_received'] ?? 1);
                    
                    $totalCostValue = (float) ($itemData['subtotal'] ?? 0);

                    if (isset($itemData['id'])) {
                        // Update Existing Item
                        $item = GRNItem::findOrFail($itemData['id']);
                        $batch = StockBatch::where('grn_id', $grn->id)
                            ->where('medicine_id', $item->medicine_id)
                            ->where('batch_number', $item->batch_number)
                            ->first();

                        if ($batch) {
                            // If medicine changed or dosage form changed, and there are movements, block it
                            if (($item->medicine_id != $itemData['medicine_id'] || $item->dosage_form_snapshot != $itemData['dosage_form_snapshot'])) {
                                $this->validateNoMovements($batch);
                            }

                            // Calculate stock difference
                            $oldTotalTablets = $batch->qty_tablets;
                            $diff = $totalTablets - $oldTotalTablets;

                            // Calculate box difference for remaining quantity
                            $oldQtyBoxes = (float) $batch->qty_boxes;
                            $newQtyBoxes = (float) $itemData['qty_boxes_received'];
                            $diffBoxes = $newQtyBoxes - $oldQtyBoxes;

                            // If decreasing, ensure we don't go below what was already moved
                            if ($diff < 0) {
                                $movedQty = $batch->qty_tablets - $batch->qty_tablets_remaining;
                                if ($totalTablets < $movedQty) {
                                    throw new \Exception("Cannot reduce quantity of batch '{$batch->batch_number}' below sold units ({$movedQty}).");
                                }
                            }

                            // Update Batch
                            $batch->update([
                                'medicine_id' => $itemData['medicine_id'],
                                'supplier_id' => $grn->supplier_id,
                                'dosage_form_snapshot' => $itemData['dosage_form_snapshot'],
                                'batch_number' => $itemData['batch_number'] ?? $batch->batch_number,
                                'expiry_date' => $itemData['expiry_date'],
                                'qty_tablets' => $totalTablets,
                                'qty_tablets_remaining' => $batch->qty_tablets_remaining + $diff,
                                'qty_boxes' => $itemData['qty_boxes_received'],
                                'qty_boxes_remaining' => $batch->qty_boxes_remaining + $diffBoxes,
                                'qty_units' => $isGroupA ? null : $totalTablets,
                                'qty_units_remaining' => $isGroupA ? null : ($batch->qty_units_remaining + $diff),
                                'cost_per_unit' => $itemData['cost_per_unit'],
                                'cost_per_stripe' => $itemData['cost_per_stripe'] ?? null,
                                'cost_per_box' => $itemData['cost_per_box'] ?? null,
                                'ingested_total_cost_value' => $totalCostValue, // Original total cost
                                'received_date' => $grn->received_date,
                            ]);

                            // Update Medicine Stock
                            if ($diff != 0) {
                                Medicine::where('id', $itemData['medicine_id'])->increment('stock', $diff);
                            }
                        }

                        // Update GRN Item
                        $item->update([
                            'medicine_id' => $itemData['medicine_id'],
                            'dosage_form_snapshot' => $itemData['dosage_form_snapshot'],
                            'batch_number' => $itemData['batch_number'] ?? $item->batch_number,
                            'expiry_date' => $itemData['expiry_date'],
                            'qty_boxes_received' => $itemData['qty_boxes_received'],
                            'qty_units_received' => $itemData['qty_units_received'] ?? null,
                            'package_size' => $itemData['package_size'] ?? null,
                            'cost_per_box' => $itemData['cost_per_box'] ?? null,
                            'cost_per_stripe' => $itemData['cost_per_stripe'] ?? null,
                            'cost_per_unit' => $itemData['cost_per_unit'] ?? null,
                            'subtotal' => $itemData['subtotal'] ?? 0,
                        ]);

                    } else {
                        // Create New Item
                        $batchNumber = $itemData['batch_number'] ?? 'BAT-' . strtoupper(substr(uniqid(), -6));
                        
                        GRNItem::create([
                            'grn_id' => $grn->id,
                            'medicine_id' => $itemData['medicine_id'],
                            'dosage_form_snapshot' => $itemData['dosage_form_snapshot'],
                            'batch_number' => $batchNumber,
                            'expiry_date' => $itemData['expiry_date'],
                            'qty_boxes_received' => $itemData['qty_boxes_received'],
                            'qty_units_received' => $itemData['qty_units_received'] ?? null,
                            'package_size' => $itemData['package_size'] ?? null,
                            'cost_per_box' => $itemData['cost_per_box'] ?? null,
                            'cost_per_stripe' => $itemData['cost_per_stripe'] ?? null,
                            'cost_per_unit' => $itemData['cost_per_unit'] ?? null,
                            'subtotal' => $itemData['subtotal'] ?? 0,
                        ]);

                        StockBatch::create([
                            'medicine_id' => $itemData['medicine_id'],
                            'supplier_id' => $grn->supplier_id,
                            'grn_id' => $grn->id,
                            'dosage_form_snapshot' => $itemData['dosage_form_snapshot'],
                            'batch_number' => $batchNumber,
                            'expiry_date' => $itemData['expiry_date'],
                            'qty_tablets' => $totalTablets,
                            'qty_tablets_remaining' => $totalTablets,
                            'qty_boxes' => $itemData['qty_boxes_received'],
                            'qty_boxes_remaining' => $itemData['qty_boxes_received'],
                            'qty_units' => $isGroupA ? null : $totalTablets,
                            'qty_units_remaining' => $isGroupA ? null : $totalTablets,
                            'cost_per_unit' => $itemData['cost_per_unit'],
                            'cost_per_stripe' => $itemData['cost_per_stripe'] ?? null,
                            'cost_per_box' => $itemData['cost_per_box'] ?? null,
                            'total_cost_value' => $totalCostValue,
                            'ingested_total_cost_value' => $totalCostValue,
                            'received_date' => $grn->received_date,
                        ]);

                        Medicine::where('id', $itemData['medicine_id'])->increment('stock', $totalTablets);
                    }
                }

                // 3. Sync associated PurchaseOrder
                if ($grn->purchase_order_id) {
                    PurchaseOrder::where('id', $grn->purchase_order_id)->update([
                        'paid_amount' => $grn->paid_amount,
                        'payment_status' => $grn->payment_status,
                        'total_amount' => $grn->total_amount,
                    ]);
                }

                // 4. Re-calculate Cash Transaction
                if ($oldPaidAmount !== (float) $grn->paid_amount) {
                    if ($oldPaidAmount > 0) {
                        CashTransaction::record(
                            CashTransaction::TYPE_GRN_REVERSAL,
                            $oldPaidAmount,
                            "Reversal of Edited GRN ({$grn->invoice_number})"
                        );
                    }
                    if ($grn->paid_amount > 0) {
                         CashTransaction::record(
                            'grn_payment',
                            $grn->paid_amount,
                            "Updated GRN Payment ({$grn->invoice_number})",
                            'grn',
                            $grn->id,
                            $grn->invoice_number,
                            'cash',
                            $grn->supplier?->name,
                            'supplier',
                            Auth::id()
                        );
                    }
                }

                $this->clearCache();
                return $grn->fresh(['supplier', 'purchaseOrder', 'items.medicine']);
            });

            return response()->json([
                'success' => true,
                'message' => 'GRN updated successfully',
                'data' => new GRNResource($grn)
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public function destroy(GRN $grn): JsonResponse
    {
        try {
            DB::transaction(function () use ($grn) {
                // Safety Check: Ensure no items have movements
                $batches = StockBatch::where('grn_id', $grn->id)->get();
                foreach ($batches as $batch) {
                    $this->validateNoMovements($batch);
                }

                // If it was paid, reverse the cash transaction
                if ($grn->paid_amount > 0) {
                    CashTransaction::record(
                        CashTransaction::TYPE_GRN_REVERSAL,
                        $grn->paid_amount,
                        "Reversal of Deleted GRN ({$grn->invoice_number})"
                    );
                }

                $this->reverseGrnStock($grn);
                $grn->items()->forceDelete();
                $grn->delete();

                $this->clearCache();
            });

            return response()->json(null, 204);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * Internal helper to verify if a batch has existing movements.
     */
    private function validateNoMovements(StockBatch $batch): void
    {
        $hasSales = SaleItem::where('stock_batch_id', $batch->id)->exists();
        $hasReturns = SalesReturnItem::where('stock_batch_id', $batch->id)->exists();
        $hasAdjustments = StockAdjustment::where('stock_batch_id', $batch->id)->exists();

        if ($hasSales || $hasReturns || $hasAdjustments) {
            throw new \Exception("Action Denied — Batch '{$batch->batch_number}' already has active sales, returns, or adjustments.");
        }
    }

    /**
     * Legacy helper to verify if any batch in the GRN has existing movements.
     */
    private function checkHasMovements(GRN $grn): void
    {
        $batches = StockBatch::where('grn_id', $grn->id)->get();
        foreach ($batches as $batch) {
            $this->validateNoMovements($batch);
        }
    }

    /**
     * Safely reverse stock impact.
     */
    private function reverseGrnStock(GRN $grn): void
    {
        $grn->loadMissing('items');
        $batches = StockBatch::where('grn_id', $grn->id)->get();
        $stockDecrements = [];

        foreach ($batches as $batch) {
            if (!isset($stockDecrements[$batch->medicine_id])) {
                $stockDecrements[$batch->medicine_id] = 0;
            }
            $stockDecrements[$batch->medicine_id] += $batch->qty_tablets_remaining;
            $batch->forceDelete();
        }

        // Batched decremental updates
        if (!empty($stockDecrements)) {
            foreach ($stockDecrements as $medicineId => $decrement) {
                Medicine::where('id', $medicineId)->decrement('stock', $decrement);
            }
        }
    }

    /**
     * Clear all relevant caches.
     */
    private function clearCache(): void
    {
        if (Cache::getStore() instanceof \Illuminate\Cache\TaggableStore) {
            Cache::tags(['medicines', 'stock', 'inventory', 'reports', 'dashboard', 'sales', 'cash'])->flush();
        } else {
            Cache::flush();
        }
    }
}
