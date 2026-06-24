<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Models\Medicine;
use App\Models\PurchaseOrderItem;
use Illuminate\Http\Request;
use App\Http\Requests\Api\PurchaseOrderRequest;
use App\Http\Resources\Api\PurchaseOrderResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

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

        $query = PurchaseOrder::with([
            'supplier:id,name', 
            'items.medicine:id,medicine_name,dosage_form'
        ]);

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

        $orders = $query->orderBy('purchase_orders.order_date', 'desc')->paginate($perPage);
        return PurchaseOrderResource::collection($orders);
    }

    /**
     * Store a new Purchase Order and its items.
     */
    public function store(PurchaseOrderRequest $request): JsonResponse
    {
        $data = $request->validated();

        try {
            $po = DB::transaction(function () use ($data) {
                $po = PurchaseOrder::create([
                    'supplier_id'    => $data['supplier_id'],
                    'order_date'     => $data['order_date'],
                    'notes'          => $data['notes'] ?? null,
                    'total_amount'   => 0, // Will be synced
                    'status'         => PurchaseOrder::STATUS_PENDING,
                    'payment_status' => $data['payment_status'] ?? PurchaseOrder::PAYMENT_STATUS_DUE,
                    'paid_amount'    => $data['paid_amount'] ?? 0,
                ]);

                $po->syncItems($data['items']);
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
    public function update(PurchaseOrderRequest $request, PurchaseOrder $po): JsonResponse
    {
        // Guard: Prevent modification of Received orders
        if ($po->status === PurchaseOrder::STATUS_RECEIVED) {
            return response()->json(['success' => false, 'message' => 'Cannot modify a received purchase order.'], 403);
        }

        try {
            $data = $request->validated();

            $po = DB::transaction(function () use ($po, $data) {
                // Row-level lock for concurrency safety
                $po = PurchaseOrder::where('id', $po->id)->lockForUpdate()->first();

                $po->update([
                    'supplier_id' => $data['supplier_id'],
                    'order_date'  => $data['order_date'],
                    'notes'       => $data['notes'] ?? null,
                    'paid_amount' => $data['paid_amount'] ?? $po->paid_amount,
                    'payment_status' => $data['payment_status'] ?? $po->payment_status,
                ]);

                $po->syncItems($data['items']);

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
        $statuses = implode(',', [
            PurchaseOrder::STATUS_PENDING, 
            PurchaseOrder::STATUS_RECEIVED, 
            PurchaseOrder::STATUS_CANCELLED
        ]);

        $data = $request->validate([
            'status' => "required|string|in:{$statuses}",
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
        if ($po->status === PurchaseOrder::STATUS_RECEIVED) {
            return response()->json(['success' => false, 'message' => 'Cannot delete a received purchase order.'], 403);
        }

        $po->delete();
        $this->clearCache();
        return response()->json(null, 204);
    }

    private function clearCache(): void
    {
        if (Cache::getStore() instanceof \Illuminate\Cache\TaggableStore) {
            \Illuminate\Support\Facades\Cache::tags(['inventory', 'reports', 'dashboard', 'sales'])->flush();
        } else {
            \Illuminate\Support\Facades\Cache::flush();
        }
    }
}
