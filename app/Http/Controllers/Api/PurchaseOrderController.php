<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

use App\Models\PurchaseOrder;
use App\Services\PurchaseOrderService;
use Illuminate\Http\Request;
use App\Http\Requests\Api\StorePurchaseOrderRequest;
use App\Http\Requests\Api\UpdatePurchaseOrderRequest;
use App\Http\Resources\Api\PurchaseOrderResource;

class PurchaseOrderController extends Controller
{
    private PurchaseOrderService $poService;

    public function __construct(PurchaseOrderService $poService)
    {
        $this->poService = $poService;
    }

    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search');
        $status = $request->get('status');
        $fromDate = $request->get('from_date');
        $toDate = $request->get('to_date');
        $hasNoGrn = $request->boolean('has_no_grn');
        
        $orders = $this->poService->getAllOrders($perPage, $search, $status, $fromDate, $toDate, $hasNoGrn);
        return PurchaseOrderResource::collection($orders);
    }

    public function store(StorePurchaseOrderRequest $request)
    {
        $order = $this->poService->createOrder($request->validated());
        return new PurchaseOrderResource($order);
    }

    public function show(int $id)
    {
        $order = $this->poService->getOrderDetails($id);
        return new PurchaseOrderResource($order);
    }

    public function update(UpdatePurchaseOrderRequest $request, int $id)
    {
        $order = $this->poService->getOrderDetails($id);
        
        if ($order->status === 'Received' || $order->status === 'Cancelled') {
            return response()->json(['message' => 'Cannot update an order that is already Received or Cancelled.'], 403);
        }

        $order = $this->poService->updateOrder($order, $request->validated());
        return new PurchaseOrderResource($order);
    }

    public function updateStatus(Request $request, PurchaseOrder $purchaseOrder)
    {
        $request->validate([
            'status' => 'required|in:Pending,Received,Cancelled'
        ]);

        $order = $this->poService->updateOrderStatus($purchaseOrder, $request->status);
        return new PurchaseOrderResource($order);
    }

    public function destroy(PurchaseOrder $purchaseOrder)
    {
        $this->poService->deleteOrder($purchaseOrder);
        return response()->noContent();
    }
}
