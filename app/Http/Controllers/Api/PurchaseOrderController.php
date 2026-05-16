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
    /**
     * List purchase orders with optimized joins and selective eager loading.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = $request->integer('per_page', 10);
        $search = $request->get('search');
        $status = $request->get('status');
        $fromDate = $request->get('from_date');
        $toDate = $request->get('to_date');
        $hasNoGrn = $request->get('has_no_grn') === 'true';

        $query = PurchaseOrder::with(['supplier:id,name', 'items.medicine:id,medicine_name']);

        if ($search) {
            // Optimized join to utilize supplier index
            $query->join('suppliers', 'purchase_orders.supplier_id', '=', 'suppliers.id')
                  ->where(function($q) use ($search) {
                      $q->where('suppliers.name', 'like', "{$search}%")
                        ->orWhere('purchase_orders.notes', 'like', "{$search}%");
                  })
                  ->select('purchase_orders.*');
        }

        if ($status) {
            $query->where(function($q) use ($status) {
                $q->where('purchase_orders.status', $status)
                  ->orWhere('purchase_orders.payment_status', $status);
            });
        }

        if ($fromDate && $toDate) {
            $query->whereBetween('purchase_orders.order_date', [$fromDate, $toDate]);
        }

        if ($hasNoGrn) {
            $query->whereDoesntHave('grns');
        }

        $orders = $query->orderBy('purchase_orders.order_date', 'desc')->simplePaginate($perPage);
        return PurchaseOrderResource::collection($orders);
    }

    /**
     * Store a new Purchase Order and its items.
     */
    public function store(StorePurchaseOrderRequest $request): JsonResponse
    {
        $data = $request->validated();

        try {
            $po = DB::transaction(function () use ($data) {
                // Calculate total in-memory for speed
                $totalAmount = collect($data['items'])->sum(fn($item) => (float) ($item['qty_boxes'] * $item['cost_per_box']));

                $po = PurchaseOrder::create([
                    'supplier_id' => $data['supplier_id'],
                    'order_date' => $data['order_date'],
                    'notes' => $data['notes'] ?? null,
                    'total_amount' => $totalAmount,
                    'status' => 'Pending',
                    'payment_status' => 'Due',
                ]);

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
                        'subtotal' => (float) ($item['qty_boxes'] * $item['cost_per_box']),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }

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

    /**
     * Update an existing Purchase Order. Implements transition guards.
     */
    public function update(UpdatePurchaseOrderRequest $request, PurchaseOrder $po): JsonResponse
    {
        // Guard: Prevent modification of Received orders
        if ($po->status === 'Received') {
            return response()->json(['success' => false, 'message' => 'Cannot modify a received purchase order.'], 403);
        }

        try {
            $data = $request->validated();

            $po = DB::transaction(function () use ($po, $data) {
                $totalAmount = collect($data['items'])->sum(fn($item) => (float) ($item['qty_boxes'] * $item['cost_per_box']));

                $po->update([
                    'supplier_id' => $data['supplier_id'],
                    'order_date' => $data['order_date'],
                    'notes' => $data['notes'] ?? null,
                    'total_amount' => $totalAmount,
                ]);

                // Delete existing and bulk-reinsert for consistency
                $po->items()->delete();

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
                        'subtotal' => (float) ($item['qty_boxes'] * $item['cost_per_box']),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
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
        $data = $request->validate([
            'status' => 'required|string|in:Pending,Received,Cancelled',
        ]);

        $po->update(['status' => $data['status']]);

        return response()->json([
            'success' => true,
            'message' => 'Order status updated successfully',
            'data' => new PurchaseOrderResource($po)
        ]);
    }

    public function destroy(PurchaseOrder $po): JsonResponse
    {
        // Guard: Prevent deletion of Received orders
        if ($po->status === 'Received') {
            return response()->json(['success' => false, 'message' => 'Cannot delete a received purchase order.'], 403);
        }

        $po->delete();
        return response()->json(null, 204);
    }
}
