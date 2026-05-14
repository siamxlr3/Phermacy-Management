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

class GRNController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search');
        $fromDate = $request->get('from_date');
        $toDate = $request->get('to_date');

        $query = GRN::with(['supplier', 'purchaseOrder', 'items.medicine']);

        if ($search) {
            // FIX: JOIN instead of whereHas to eliminate the correlated subquery
            $query->join('suppliers', 'grns.supplier_id', '=', 'suppliers.id')
                  ->where(function($q) use ($search) {
                      $q->where('grns.invoice_number', 'like', "{$search}%")
                        ->orWhere('suppliers.name', 'like', "{$search}%");
                  })
                  ->select('grns.*');
        }

        if ($fromDate && $toDate) {
            $query->whereBetween('received_date', [$fromDate, $toDate]);
        }

        $grns = $query->orderBy('received_date', 'desc')->simplePaginate($perPage);
        return GRNResource::collection($grns);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'purchase_order_id' => 'nullable|exists:purchase_orders,id',
            'received_date' => 'required|date',
            'invoice_number' => 'nullable|string|max:255',
            'received_by' => 'nullable|string|max:255',
            'total_amount' => 'required|numeric|min:0',
            'paid_amount' => 'nullable|numeric|min:0',
            'payment_status' => 'required|string|in:Paid,Partially Paid,Due',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.medicine_id' => 'required|exists:medicines,id',
            'items.*.dosage_form_snapshot' => 'required|string',
            'items.*.batch_number' => 'required|string|max:255',
            'items.*.expiry_date' => 'required|date',
            'items.*.qty_boxes_received' => 'required|integer|min:1',
            'items.*.qty_units_received' => 'nullable|integer',
            'items.*.package_size' => 'nullable|string',
            'items.*.cost_per_box' => 'nullable|numeric',
            'items.*.cost_per_stripe' => 'nullable|numeric',
            'items.*.cost_per_unit' => 'required|numeric',
            'items.*.subtotal' => 'required|numeric|min:0',
        ]);

        try {
            $grn = DB::transaction(function () use ($data) {
                $medicineIds = collect($data['items'])->pluck('medicine_id');
                $medicines = Medicine::whereIn('id', $medicineIds)->get()->keyBy('id');

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

                $invoiceNumber = $data['invoice_number'];
                if (empty($invoiceNumber)) {
                    $lastGRN = DB::table('grns')->lockForUpdate()->latest('id')->first();
                    $number = 1;
                    if ($lastGRN && $lastGRN->invoice_number) {
                        preg_match('/(\d+)/', $lastGRN->invoice_number, $matches);
                        if (!empty($matches)) {
                            $number = (int) $matches[0] + 1;
                        }
                    }
                    $invoiceNumber = 'GRN-' . str_pad($number, 6, '0', STR_PAD_LEFT);
                }

                $grn = GRN::create([
                    'purchase_order_id' => $data['purchase_order_id'] ?? null,
                    'supplier_id' => $data['supplier_id'],
                    'received_date' => $data['received_date'],
                    'invoice_number' => $invoiceNumber,
                    'received_by' => $data['received_by'] ?? null,
                    'total_amount' => $data['total_amount'],
                    'paid_amount' => $data['paid_amount'] ?? 0,
                    'payment_status' => $data['payment_status'] ?? 'Due',
                    'notes' => $data['notes'] ?? null,
                ]);

                $grnItemsData = [];
                $stockBatchesData = [];

                foreach ($data['items'] as $item) {
                    $medicine = $medicines->get($item['medicine_id']);
                    
                    $grnItemsData[] = [
                        'grn_id' => $grn->id,
                        'medicine_id' => $item['medicine_id'],
                        'dosage_form_snapshot' => $item['dosage_form_snapshot'],
                        'batch_number' => $item['batch_number'],
                        'expiry_date' => $item['expiry_date'],
                        'qty_boxes_received' => $item['qty_boxes_received'],
                        'qty_units_received' => $item['qty_units_received'] ?? null,
                        'package_size' => $item['package_size'] ?? null,
                        'cost_per_box' => $item['cost_per_box'] ?? null,
                        'cost_per_stripe' => $item['cost_per_stripe'] ?? null,
                        'cost_per_unit' => $item['cost_per_unit'],
                        'subtotal' => $item['subtotal'],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];

                    // Calculate total units and secondary quantities based on dosage form
                    $isGroupA = in_array($item['dosage_form_snapshot'], ['Tablet', 'Capsule', 'Suppository', 'Sachet']);
                    
                    $totalTablets = 0;
                    $totalUnits = 0; // Group B units (bottles/tubes)
                    
                    if ($isGroupA) {
                        $totalTablets = $item['qty_boxes_received'] * (($medicine?->tablets_per_strip ?? 1) * ($medicine?->strips_per_box ?? 1));
                    } else {
                        $totalUnits = $item['qty_boxes_received'] * ($item['qty_units_received'] ?? 1);
                        $totalTablets = $totalUnits; // For non-tablets, total_tablets acts as smallest unit count
                    }

                    $stockBatchesData[] = [
                        'medicine_id' => $item['medicine_id'],
                        'supplier_id' => $data['supplier_id'],
                        'grn_id' => $grn->id,
                        'dosage_form_snapshot' => $item['dosage_form_snapshot'],
                        'batch_number' => $item['batch_number'],
                        'expiry_date' => $item['expiry_date'],
                        'qty_tablets' => $totalTablets,
                        'qty_tablets_remaining' => $totalTablets,
                        'qty_boxes' => $item['qty_boxes_received'],
                        'qty_boxes_remaining' => $item['qty_boxes_received'],
                        'qty_units' => $isGroupA ? null : $totalUnits,
                        'qty_units_remaining' => $isGroupA ? null : $totalUnits,
                        'cost_per_unit' => $item['cost_per_unit'],
                        'cost_per_stripe' => $item['cost_per_stripe'] ?? null,
                        'cost_per_box' => $item['cost_per_box'] ?? null,
                        'received_date' => $data['received_date'],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];

                    $medicine?->increment('stock', $totalTablets);
                }

                GRNItem::insert($grnItemsData);
                StockBatch::insert($stockBatchesData);

                if (!empty($data['purchase_order_id'])) {
                    PurchaseOrder::where('id', $data['purchase_order_id'])
                        ->where('status', '!=', 'Received')
                        ->update(['status' => 'Received']);
                }

                Cache::forget('medicines.active_list');
                Cache::tags(['inventory'])->flush();
                Cache::tags(['reports'])->flush();

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

    public function update(Request $request, GRN $grn): JsonResponse
    {
        $data = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'purchase_order_id' => 'nullable|exists:purchase_orders,id',
            'received_date' => 'required|date',
            'invoice_number' => 'nullable|string|max:255',
            'received_by' => 'nullable|string|max:255',
            'total_amount' => 'required|numeric|min:0',
            'paid_amount' => 'nullable|numeric|min:0',
            'payment_status' => 'required|string|in:Paid,Partially Paid,Due',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.medicine_id' => 'required|exists:medicines,id',
            'items.*.dosage_form_snapshot' => 'required|string',
            'items.*.batch_number' => 'required|string|max:255',
            'items.*.expiry_date' => 'required|date',
            'items.*.qty_boxes_received' => 'required|integer|min:1',
            'items.*.qty_units_received' => 'nullable|integer',
            'items.*.package_size' => 'nullable|string',
            'items.*.cost_per_box' => 'nullable|numeric',
            'items.*.cost_per_stripe' => 'nullable|numeric',
            'items.*.cost_per_unit' => 'required|numeric',
            'items.*.subtotal' => 'required|numeric|min:0',
        ]);

        try {
            $grn = DB::transaction(function () use ($grn, $data) {
                $this->reverseGrnStock($grn);
                $grn->items()->delete();

                $grn->update([
                    'purchase_order_id' => $data['purchase_order_id'] ?? $grn->purchase_order_id,
                    'supplier_id' => $data['supplier_id'],
                    'received_date' => $data['received_date'],
                    'invoice_number' => $data['invoice_number'] ?? null,
                    'received_by' => $data['received_by'] ?? null,
                    'total_amount' => $data['total_amount'],
                    'paid_amount' => $data['paid_amount'] ?? 0,
                    'payment_status' => $data['payment_status'] ?? 'Due',
                    'notes' => $data['notes'] ?? null,
                ]);

                $medicineIds = collect($data['items'])->pluck('medicine_id');
                $medicines = Medicine::whereIn('id', $medicineIds)->get()->keyBy('id');

                $grnItemsData = [];
                $stockBatchesData = [];

                foreach ($data['items'] as $item) {
                    $medicine = $medicines->get($item['medicine_id']);
                    
                    $grnItemsData[] = [
                        'grn_id' => $grn->id,
                        'medicine_id' => $item['medicine_id'],
                        'dosage_form_snapshot' => $item['dosage_form_snapshot'],
                        'batch_number' => $item['batch_number'],
                        'expiry_date' => $item['expiry_date'],
                        'qty_boxes_received' => $item['qty_boxes_received'],
                        'qty_units_received' => $item['qty_units_received'] ?? null,
                        'package_size' => $item['package_size'] ?? null,
                        'cost_per_box' => $item['cost_per_box'] ?? null,
                        'cost_per_stripe' => $item['cost_per_stripe'] ?? null,
                        'cost_per_unit' => $item['cost_per_unit'],
                        'subtotal' => $item['subtotal'],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];

                    $isGroupA = in_array($item['dosage_form_snapshot'], ['Tablet', 'Capsule', 'Suppository', 'Sachet']);
                    
                    $totalTablets = 0;
                    $totalUnits = 0;
                    
                    if ($isGroupA) {
                        $totalTablets = $item['qty_boxes_received'] * (($medicine?->tablets_per_strip ?? 1) * ($medicine?->strips_per_box ?? 1));
                    } else {
                        $totalUnits = $item['qty_boxes_received'] * ($item['qty_units_received'] ?? 1);
                        $totalTablets = $totalUnits;
                    }

                    $stockBatchesData[] = [
                        'medicine_id' => $item['medicine_id'],
                        'supplier_id' => $data['supplier_id'],
                        'grn_id' => $grn->id,
                        'dosage_form_snapshot' => $item['dosage_form_snapshot'],
                        'batch_number' => $item['batch_number'],
                        'expiry_date' => $item['expiry_date'],
                        'qty_tablets' => $totalTablets,
                        'qty_tablets_remaining' => $totalTablets,
                        'qty_boxes' => $item['qty_boxes_received'],
                        'qty_boxes_remaining' => $item['qty_boxes_received'],
                        'qty_units' => $isGroupA ? null : $totalUnits,
                        'qty_units_remaining' => $isGroupA ? null : $totalUnits,
                        'cost_per_unit' => $item['cost_per_unit'],
                        'cost_per_stripe' => $item['cost_per_stripe'] ?? null,
                        'cost_per_box' => $item['cost_per_box'] ?? null,
                        'received_date' => $data['received_date'],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];

                    $medicine?->increment('stock', $totalTablets);
                }

                GRNItem::insert($grnItemsData);
                StockBatch::insert($stockBatchesData);

                Cache::forget('medicines.active_list');
                Cache::tags(['inventory'])->flush();
                Cache::tags(['reports'])->flush();

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
                // FIX: Guard against editing batches that already have sales
                $batchIds = StockBatch::where('grn_id', $grn->id)->pluck('id');
                $hasSales = DB::table('sale_items')
                    ->whereIn('stock_batch_id', $batchIds)
                    ->exists();

                if ($hasSales) {
                    throw new \Exception('Cannot delete GRN — one or more batches have active sales records.');
                }

                // Safely reverse stock before soft-deleting
                $this->reverseGrnStock($grn);
                $grn->items()->delete();

                // FIX: SoftDelete on GRN only — PO is preserved for procurement audit trail
                $grn->delete();

                Cache::forget('medicines.active_list');
                Cache::tags(['inventory'])->flush();
                Cache::tags(['reports'])->flush();
            });

            return response()->json(null, 204);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * Reverse the stock impact of a GRN's batches without touching sale_items.
     * Extracted to eliminate duplication between update() and destroy().
     */
    private function reverseGrnStock(GRN $grn): void
    {
        $grn->loadMissing('items');
        $medicineIds = $grn->items->pluck('medicine_id')->unique();
        $medicines = Medicine::whereIn('id', $medicineIds)->get()->keyBy('id');

        $batches = StockBatch::where('grn_id', $grn->id)->get();

        foreach ($batches as $batch) {
            $medicine = $medicines->get($batch->medicine_id);
            // Only decrement the remaining stock that hasn't been sold yet
            $medicine?->decrement('stock', $batch->qty_tablets_remaining);
            // SoftDelete the batch — preserves existing sale_item references
            $batch->delete();
        }
    }
}
