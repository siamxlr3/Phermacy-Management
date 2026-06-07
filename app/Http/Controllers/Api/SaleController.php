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

        $query = Sale::with(['items.medicine:id,medicine_name,dosage_form,tablets_per_strip,strips_per_box', 'items.returnItems']);

        $applyFilters = function($q) use ($fromDate, $toDate, $search, $status) {
            if ($fromDate && $toDate) {
                $q->whereBetween('sale_date', [
                    \Carbon\Carbon::parse($fromDate)->startOfDay(),
                    \Carbon\Carbon::parse($toDate)->endOfDay()
                ]);
            }

            if ($search) {
                $q->where(function($sub) use ($search) {
                    $sub->where('invoice_number', 'like', "{$search}%")
                        ->orWhere('customer_name', 'like', "{$search}%")
                        ->orWhere('customer_phone', 'like', "{$search}%");
                });
            }

            if ($status) {
                $statuses = explode(',', $status);
                $q->whereIn('status', $statuses);
            }
        };

        $applyFilters($query);

        $fromDate = $fromDate ? \Carbon\Carbon::parse($fromDate)->startOfDay() : \Carbon\Carbon::now()->subDays(30)->startOfDay();
        $toDate = $toDate ? \Carbon\Carbon::parse($toDate)->endOfDay() : \Carbon\Carbon::now()->endOfDay();

        $stats = app(\App\Services\SaleReportService::class)->getSummary($fromDate, $toDate);

        $paginator = $query->latest('sale_date')->paginate($perPage);
        
        return SaleResource::collection($paginator)->additional([
            'summary' => $stats
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

                $totalItemsCount = collect($data['items'])->sum('qty_tablets');

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
                    'total_items_count' => $totalItemsCount,
                    'returned_items_count' => 0,
                ]);

                // 2. Preload batches with Row-Level Locking
                $medicineIds = collect($data['items'])->pluck('medicine_id');
                $batches = StockBatch::whereIn('medicine_id', $medicineIds)
                    ->where('qty_tablets_remaining', '>', 0)
                    ->where('expiry_date', '>', now())
                    ->orderBy('expiry_date', 'asc')
                    ->lockForUpdate() // CRITICAL: Concurrency protection
                    ->get()
                    ->groupBy('medicine_id');

                $saleItemsData = [];
                $medicineAdjustments = [];

                foreach ($data['items'] as $item) {
                    $medicineId = $item['medicine_id'];
                    $remainingToDeduct = $item['qty_tablets'];
                    $medicineBatches = $batches->get($medicineId, collect());

                    if ($medicineBatches->sum('qty_tablets_remaining') < $remainingToDeduct) {
                        $medicineName = Medicine::where('id', $medicineId)->value('medicine_name') ?? "ID: {$medicineId}";
                        
                        // Check if stock exists but is expired
                        $totalStockIncludingExpired = StockBatch::where('medicine_id', $medicineId)
                            ->available()
                            ->sum('qty_tablets_remaining');

                        if ($totalStockIncludingExpired >= $remainingToDeduct) {
                            throw new Exception("Stock expired for {$medicineName}. Please check batch expiry.");
                        }

                        throw new Exception("Insufficient stock for {$medicineName}");
                    }

                    // 3. FIFO Batch Deduction
                    foreach ($medicineBatches as $batch) {
                        if ($remainingToDeduct <= 0) break;

                        $deduct = min($batch->qty_tablets_remaining, $remainingToDeduct);
                        
                        $saleItemsData[] = [
                            'sale_id' => $sale->id,
                            'medicine_id' => $medicineId,
                            'sale_unit' => $item['sale_unit'],
                            'sale_qty' => (float) ($deduct / ($item['qty_tablets'] / $item['quantity'])),
                            'stock_batch_id' => $batch->id,
                            'qty_tablets' => $deduct,
                            'unit_price' => $item['unit_price'],
                            'tax_amount' => ($item['tax_amount'] / $item['qty_tablets']) * $deduct,
                            'subtotal' => ($item['subtotal'] / $item['qty_tablets']) * $deduct,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];

                        // Update qty_tablets_remaining AND qty_boxes_remaining together via save(),
                        // NOT decrement(). Laravel's decrement() fires updating/updated events but NOT
                        // saving/saved — so calculateValuation() would never run.
                        // By setting attributes then calling save(), the saving event fires and
                        // calculateValuation() correctly computes the new total_cost_value.
                        $tabletsPerBox = ($batch->qty_boxes > 0)
                            ? ((float) $batch->qty_tablets / (float) $batch->qty_boxes)
                            : 1;

                        $batch->qty_tablets_remaining -= $deduct;
                        if ($batch->qty_boxes_remaining !== null && $tabletsPerBox > 0) {
                            $batch->qty_boxes_remaining = round(
                                (float) $batch->qty_tablets_remaining / $tabletsPerBox,
                                4
                            );
                        }
                        $batch->save(); // triggers saving → calculateValuation() → total_cost_value updated

                        $medicineAdjustments[$medicineId] = ($medicineAdjustments[$medicineId] ?? 0) + $deduct;
                        $remainingToDeduct -= $deduct;
                    }
                }

                SaleItem::insert($saleItemsData);

                // 4. Batch update Medicine stock levels (Performance optimization)
                foreach ($medicineAdjustments as $medicineId => $totalDeduct) {
                    Medicine::where('id', $medicineId)->decrement('stock', $totalDeduct);
                }

                // 5. Update Ledger
                if ($sale->paid_amount > 0) {
                    \App\Models\CashTransaction::record(
                        'In',
                        $sale->paid_amount,
                        "Sale Payment - Invoice {$sale->invoice_number}",
                        'sale',
                        $sale->id,
                        $sale->invoice_number,
                        ($data['payment_method'] ?? 'Cash') === 'Due' ? 'Cash' : ($data['payment_method'] ?? 'Cash'),
                        $sale->customer_name,
                        'customer',
                        Auth::id()
                    );
                }

                Cache::tags(['sales', 'dashboard', 'cash'])->flush();
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
        $sale = Sale::with(['items.medicine:id,medicine_name,dosage_form,tablets_per_strip,strips_per_box', 'items.batch', 'items.returnItems'])->find($id);
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
                        "Due Payment Collected - Invoice {$sale->invoice_number}",
                        'sale',
                        $sale->id,
                        $sale->invoice_number,
                        $sale->payment_method,
                        $sale->customer_name,
                        'customer',
                        Auth::id()
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
