<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Models\Medicine;
use App\Models\PurchaseOrderItem;
use Illuminate\Http\Request;
use App\Http\Requests\Api\StorePurchaseOrderRequest;
use App\Http\Resources\Api\PurchaseOrderResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class PurchaseOrderController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search');
        $status = $request->get('status');
        $fromDate = $request->get('from_date');
        $toDate = $request->get('to_date');
        $hasNoGrn = $request->get('has_no_grn') === 'true';

        $query = PurchaseOrder::with(['supplier', 'items.medicine']);

        if ($search) {
            // FIX: JOIN instead of whereHas to eliminate the slow correlated subquery
            $query->join('suppliers', 'purchase_orders.supplier_id', '=', 'suppliers.id')
                  ->where(function($q) use ($search) {
                      $q->where('suppliers.name', 'like', "{$search}%")
                        ->orWhere('purchase_orders.notes', 'like', "{$search}%");
                  })
                  ->select('purchase_orders.*');
        }

        if ($status) {
            $query->where(function($q) use ($status) {
                $q->where('status', $status)
                  ->orWhere('payment_status', $status);
            });
        }

        if ($fromDate && $toDate) {
            $query->whereBetween('order_date', [$fromDate, $toDate]);
        }

        if ($hasNoGrn) {
            $query->whereDoesntHave('grns');
        }

        $orders = $query->orderBy('order_date', 'desc')->simplePaginate($perPage);
        return PurchaseOrderResource::collection($orders);
    }

    public function store(StorePurchaseOrderRequest $request): JsonResponse
    {
        $data = $request->validated();

        try {
            $po = DB::transaction(function () use ($data) {
                // Calculate total in-memory using collect()
                $totalAmount = collect($data['items'])->sum(
                    fn($item) => $item['qty_boxes'] * $item['cost_per_box']
                );

                $po = PurchaseOrder::create([
                    'supplier_id' => $data['supplier_id'],
                    'order_date' => $data['order_date'],
                    'notes' => $data['notes'] ?? null,
                    'total_amount' => $totalAmount,
                    'status' => 'Pending',
                    'payment_status' => 'Due',
                ]);

                // FIX: Pre-load all medicines in ONE query, then use in-memory lookup
                $medicineIds = collect($data['items'])->pluck('medicine_id');
                $medicines = Medicine::whereIn('id', $medicineIds)->get()->keyBy('id');

                $itemsData = [];
                foreach ($data['items'] as $item) {
                    $itemsData[] = [
                        'purchase_order_id' => $po->id,
                        'medicine_id' => $item['medicine_id'],
                        'dosage_form_snapshot' => $item['dosage_form_snapshot'],
                        'qty_boxes' => $item['qty_boxes'],
                        'cost_per_box' => $item['cost_per_box'],
                        'cost_per_stripe' => $item['cost_per_stripe'] ?? null,
                        'cost_per_unit' => $item['cost_per_unit'],
                        'subtotal' => $item['qty_boxes'] * $item['cost_per_box'],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];

                    // In-memory lookup — zero additional DB queries
                    $medicine = $medicines->get($item['medicine_id']);
                    if ($medicine) {
                        $medicine->update([
                            'cost_price' => $item['cost_per_box'],
                            'price_per_unit' => $item['cost_per_unit']
                        ]);
                    }
                }

                // FIX: Bulk insert ALL items in exactly ONE query
                PurchaseOrderItem::insert($itemsData);

                return $po;
            });

            return response()->json([
                'success' => true,
                'message' => 'Purchase order created successfully',
                'data' => new PurchaseOrderResource($po->load(['supplier', 'items.medicine']))
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public function show(PurchaseOrder $po): PurchaseOrderResource
    {
        return new PurchaseOrderResource($po->load(['supplier', 'items.medicine']));
    }

    public function update(UpdatePurchaseOrderRequest $request, PurchaseOrder $po): JsonResponse
    {
        try {
            $data = $request->validated();

            $po = DB::transaction(function () use ($po, $data) {
                $totalAmount = collect($data['items'])->sum(
                    fn($item) => $item['qty_boxes'] * $item['cost_per_box']
                );

                $po->update([
                    'supplier_id' => $data['supplier_id'],
                    'order_date' => $data['order_date'],
                    'notes' => $data['notes'] ?? null,
                    'total_amount' => $totalAmount,
                ]);

                // Delete old items and bulk-insert new ones
                $po->items()->delete();

                $medicineIds = collect($data['items'])->pluck('medicine_id');
                $medicines = Medicine::whereIn('id', $medicineIds)->get()->keyBy('id');

                $itemsData = [];
                foreach ($data['items'] as $item) {
                    $itemsData[] = [
                        'purchase_order_id' => $po->id,
                        'medicine_id' => $item['medicine_id'],
                        'dosage_form_snapshot' => $item['dosage_form_snapshot'],
                        'qty_boxes' => $item['qty_boxes'],
                        'cost_per_box' => $item['cost_per_box'],
                        'cost_per_stripe' => $item['cost_per_stripe'] ?? null,
                        'cost_per_unit' => $item['cost_per_unit'],
                        'subtotal' => $item['qty_boxes'] * $item['cost_per_box'],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];

                    $medicine = $medicines->get($item['medicine_id']);
                    if ($medicine) {
                        $medicine->update([
                            'cost_price' => $item['cost_per_box'],
                            'price_per_unit' => $item['cost_per_unit']
                        ]);
                    }
                }
                PurchaseOrderItem::insert($itemsData);

                return $po;
            });

            return response()->json([
                'success' => true,
                'message' => 'Purchase order updated successfully',
                'data' => new PurchaseOrderResource($po->fresh(['supplier', 'items.medicine']))
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public function updateStatus(Request $request, PurchaseOrder $po): JsonResponse
    {
        $request->validate([
            // FIX: Strict enum validation — no arbitrary strings allowed
            'status' => 'required|string|in:Pending,Received,Cancelled',
        ]);

        $po->update(['status' => $request->status]);

        return response()->json([
            'success' => true,
            'message' => 'Order status updated successfully',
            'data' => new PurchaseOrderResource($po)
        ]);
    }

    public function destroy(PurchaseOrder $po): JsonResponse
    {
        // FIX: SoftDelete — no more manual cascade, no data loss
        $po->delete();
        return response()->json(null, 204);
    }
}
