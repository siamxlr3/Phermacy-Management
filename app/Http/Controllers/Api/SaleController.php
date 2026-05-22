<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Medicine;
use App\Models\StockBatch;
use App\Models\User;
use App\Http\Requests\Api\StoreSaleRequest;
use App\Http\Resources\Api\SaleResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Exception;

class SaleController extends Controller
{
    /**
     * List sales with high-performance summary aggregation.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = $request->integer('per_page', 10);
        $search = $request->get('search');
        $status = $request->get('status');
        $fromDate = $request->get('from_date');
        $toDate = $request->get('to_date');

        \Illuminate\Support\Facades\Log::info("SALE API CALLED:", [
            'from_date_original' => $request->get('from_date'),
            'to_date_original' => $request->get('to_date'),
            'search' => $search,
            'status' => $status
        ]);

        $query = Sale::with(['items.medicine:id,medicine_name,dosage_form', 'items.returnItems']);

        if ($fromDate && $toDate) {
            $query->whereBetween('sale_date', [
                \Carbon\Carbon::parse($fromDate)->startOfDay(),
                \Carbon\Carbon::parse($toDate)->endOfDay()
            ]);
        }

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('invoice_number', 'like', "{$search}%")
                  ->orWhere('customer_name', 'like', "{$search}%")
                  ->orWhere('customer_phone', 'like', "{$search}%");
            });
        }

        if ($status) {
            $statuses = explode(',', $status);
            $query->whereIn('status', $statuses);
        }

        // Consolidated Summary Stats in ONE query
        $stats = Sale::query()
            ->when($fromDate && $toDate, function($q) use ($fromDate, $toDate) {
                $q->whereBetween('sale_date', [
                    \Carbon\Carbon::parse($fromDate)->startOfDay(),
                    \Carbon\Carbon::parse($toDate)->endOfDay()
                ]);
            })
            ->selectRaw("
                SUM(grand_total) as total_gross,
                SUM(CASE WHEN status IN ('Completed', 'Due', 'Partially Returned', 'Returned') THEN (grand_total - COALESCE(refunded_subtotal, 0)) ELSE 0 END) as total_amount,
                SUM(CASE WHEN status IN ('Completed', 'Partially Returned', 'Returned') THEN (grand_total - COALESCE(refunded_subtotal, 0)) ELSE 0 END) as total_completed,
                SUM(COALESCE(refunded_subtotal, 0)) as total_returned,
                SUM(due_amount) as total_due,
                COUNT(DISTINCT CASE WHEN due_amount > 0 THEN customer_phone END) as total_due_customers
            ")
            ->first();

        $paginator = $query->latest('sale_date')->simplePaginate($perPage);
        
        return SaleResource::collection($paginator)->additional([
            'summary' => [
                'total_gross'         => (float) ($stats->total_gross ?? 0),
                'total_amount'        => (float) ($stats->total_amount ?? 0),
                'total_completed'     => (float) ($stats->total_completed ?? 0),
                'total_returned'      => (float) ($stats->total_returned ?? 0),
                'total_due'           => (float) ($stats->total_due ?? 0),
                'total_due_customers' => (int)   ($stats->total_due_customers ?? 0)
            ]
        ]);
    }

    /**
     * Process a sale with accurate batch-splitting and FIFO inventory deduction.
     */
    public function store(StoreSaleRequest $request): JsonResponse
    {
        $data = $request->validated();

        try {
            $sale = DB::transaction(function () use ($data) {
                // 1. Atomic Invoice Generation
                $lastSale = DB::table('sales')->lockForUpdate()->latest('id')->first();
                $number = $lastSale ? (int) substr($lastSale->invoice_number, 4) + 1 : 1;
                $invoiceNumber = 'INV-' . str_pad($number, 6, '0', STR_PAD_LEFT);

                $sale = Sale::create([
                    'user_id' => Auth::id() ?? (User::first()->id ?? null),
                    'invoice_number' => $invoiceNumber,
                    'sale_date' => now(),
                    'customer_name' => $data['customer_name'] ?? null,
                    'customer_phone' => $data['customer_phone'] ?? null,
                    'subtotal' => $data['subtotal'],
                    'tax_total' => $data['tax_total'] ?? 0,
                    'discount_total' => $data['discount_total'] ?? 0,
                    'grand_total' => $data['grand_total'],
                    'payment_method' => ($data['payment_method'] ?? 'Cash') === 'Due' ? 'Cash' : ($data['payment_method'] ?? 'Cash'),
                    'status' => ($data['payment_method'] ?? null) === 'Due' ? 'Due' : 'Completed',
                    'notes' => $data['notes'] ?? null,
                    'paid_amount' => ($data['payment_method'] ?? null) === 'Due' ? 0 : $data['grand_total'],
                    'due_amount' => ($data['payment_method'] ?? null) === 'Due' ? $data['grand_total'] : 0,
                ]);

                // 2. Preload batches for optimized processing
                $medicineIds = collect($data['items'])->pluck('medicine_id');
                $batches = StockBatch::whereIn('medicine_id', $medicineIds)
                    ->where('qty_tablets_remaining', '>', 0)
                    ->where('expiry_date', '>', now())
                    ->orderBy('expiry_date', 'asc')
                    ->get()
                    ->groupBy('medicine_id');

                $saleItemsData = [];

                foreach ($data['items'] as $item) {
                    $medicineId = $item['medicine_id'];
                    $remainingToDeduct = $item['qty_tablets'];
                    $medicineBatches = $batches->get($medicineId, collect());

                    if ($medicineBatches->sum('qty_tablets_remaining') < $remainingToDeduct) {
                        throw new Exception("Insufficient stock for medicine ID: {$medicineId}");
                    }

                    // 3. FIFO Batch Deduction with Multi-Row Tracking (Crucial for Audit)
                    foreach ($medicineBatches as $batch) {
                        if ($remainingToDeduct <= 0) break;

                        $deduct = min($batch->qty_tablets_remaining, $remainingToDeduct);
                        
                        // Create a separate SaleItem for EACH batch used
                        $saleItemsData[] = [
                            'sale_id' => $sale->id,
                            'medicine_id' => $medicineId,
                            'sale_unit' => $item['sale_unit'],
                            'sale_qty' => (float) ($deduct / ($item['qty_tablets'] / $item['quantity'])), // Weighted qty
                            'stock_batch_id' => $batch->id,
                            'qty_tablets' => $deduct,
                            'unit_price' => $item['unit_price'],
                            'tax_amount' => ($item['tax_amount'] / $item['qty_tablets']) * $deduct,
                            'subtotal' => ($item['subtotal'] / $item['qty_tablets']) * $deduct,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];

                        $batch->decrement('qty_tablets_remaining', $deduct);
                        Medicine::where('id', $medicineId)->decrement('stock', $deduct);
                        $remainingToDeduct -= $deduct;
                    }
                }

                SaleItem::insert($saleItemsData);

                // 4. Update Ledger
                if ($sale->paid_amount > 0) {
                    \App\Models\CashTransaction::record(
                        'In',
                        $sale->paid_amount,
                        "Sale Payment - Invoice {$sale->invoice_number}"
                    );
                }

                Cache::tags(['sales', 'dashboard'])->flush();
                return $sale;
            });

            return response()->json([
                'success' => true,
                'message' => 'Sale processed successfully',
                'data' => new SaleResource($sale->load('items.medicine'))
            ], 201);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public function show(int $id): JsonResponse
    {
        $sale = Sale::with(['items.medicine', 'items.batch', 'items.returnItems'])->find($id);
        if (!$sale) {
            return response()->json(['message' => 'Sale not found'], 404);
        }
        return response()->json(['success' => true, 'data' => new SaleResource($sale)]);
    }

    public function updateStatus(Request $request, Sale $sale): JsonResponse
    {
        $request->validate([
            'status' => 'required|string|in:Completed,Due,Returned',
            'paid_amount' => 'nullable|numeric|min:0',
            'due_amount' => 'nullable|numeric|min:0',
        ]);

        try {
            DB::transaction(function () use ($sale, $request) {
                $oldPaidAmount = $sale->paid_amount;
                $sale->update($request->only(['status', 'paid_amount', 'due_amount']));
                
                $newPaidAmount = $sale->paid_amount;
                if ($newPaidAmount > $oldPaidAmount) {
                    \App\Models\CashTransaction::record(
                        'In',
                        $newPaidAmount - $oldPaidAmount,
                        "Due Payment Collected - Invoice {$sale->invoice_number}"
                    );
                }
            });
            
            Cache::tags(['sales', 'dashboard'])->flush();
            return response()->json([
                'success' => true,
                'message' => 'Sale status updated successfully',
                'data' => new SaleResource($sale->fresh())
            ]);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }
}
