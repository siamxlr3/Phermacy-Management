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
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search');
        $status = $request->get('status');

        $query = Sale::with(['items.medicine']);

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%")
                  ->orWhere('customer_phone', 'like', "%{$search}%");
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        // Cache dynamic sums to prevent DB locking at 1M+ rows
        $totalAmount = Cache::remember('sales_total_amount', 300, fn() => Sale::sum('grand_total'));
        $totalDue = Cache::remember('sales_total_due', 300, fn() => Sale::sum('due_amount'));
        $totalDueCustomers = Cache::remember('sales_total_due_customers', 300, fn() => Sale::where('due_amount', '>', 0)->distinct('customer_phone')->count('customer_phone'));

        $paginator = $query->latest('sale_date')->simplePaginate($perPage);
        
        return SaleResource::collection($paginator)->additional([
            'summary' => [
                'total_amount' => $totalAmount,
                'total_due' => $totalDue,
                'total_due_customers' => $totalDueCustomers
            ]
        ]);
    }

    public function store(StoreSaleRequest $request): JsonResponse
    {
        $data = $request->validated();

        try {
            $sale = DB::transaction(function () use ($data) {
                // 1. Atomic Invoice Generation using lockForUpdate
                $lastSale = DB::table('sales')->lockForUpdate()->latest('id')->first();
                $number = $lastSale ? (int) substr($lastSale->invoice_number, 4) + 1 : 1;
                $invoiceNumber = 'INV-' . str_pad($number, 6, '0', STR_PAD_LEFT);

                // 2. Create the Sale Record
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

                // 3. Preload Collections to prevent N+1 queries in the loop
                $medicineIds = collect($data['items'])->pluck('medicine_id');
                $medicines = Medicine::whereIn('id', $medicineIds)->get()->keyBy('id');
                
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

                    $medicine = $medicines->get($medicineId);
                    if (!$medicine) {
                        throw new Exception("Medicine not found.");
                    }
                    
                    $tabletPerStripe = $medicine->tablet_per_stripe ?? 1;
                    $stripePerBox = $medicine->stripe_per_box ?? 1;

                    $medicineBatches = $batches->get($medicineId, collect());

                    if ($medicineBatches->sum('qty_tablets_remaining') < $remainingToDeduct) {
                        throw new Exception("Insufficient stock for {$medicine->name}.");
                    }

                    // Record EXACTLY ONE row per cart item to preserve the integer box/stripe count logic
                    $saleItemsData[] = [
                        'sale_id' => $sale->id,
                        'medicine_id' => $medicineId,
                        'sale_unit' => $item['sale_unit'] ?? 'Tablet',
                        'sale_qty' => (int) $item['quantity'], // Strictly integer counts (e.g. 1, 2, 7)
                        'stock_batch_id' => $medicineBatches->first()->id,
                        'qty_tablets' => $item['qty_tablets'],
                        'unit_price' => $item['unit_price'],
                        'tax_amount' => $item['tax_amount'],
                        'subtotal' => $item['subtotal'],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];

                    // Safely deduct from batches under the hood without splitting the cart item row
                    foreach ($medicineBatches as $batch) {
                        if ($remainingToDeduct <= 0) break;

                        $deductFromThisBatch = min($batch->qty_tablets_remaining, $remainingToDeduct);
                        
                        $batch->qty_tablets_remaining -= $deductFromThisBatch;
                        $batch->save();

                        Medicine::where('id', $medicineId)->decrement('stock', $deductFromThisBatch);

                        $remainingToDeduct -= $deductFromThisBatch;
                    }
                }

                // Bulk Insert items in exactly 1 query!
                SaleItem::insert($saleItemsData);

                // 4. Record the Cash Transaction to update the ledger automatically
                if ($sale->paid_amount > 0) {
                    \App\Models\CashTransaction::record(
                        'In',
                        $sale->paid_amount,
                        "Sale Payment - Invoice {$sale->invoice_number}"
                    );
                }

                // Targeted invalidation. NEVER use Cache::flush() in production!
                Cache::forget('sales_total_amount');
                Cache::forget('sales_total_due');
                Cache::forget('sales_total_due_customers');
                
                return $sale;
            });

            return response()->json([
                'success' => true,
                'message' => 'Sale processed successfully',
                'data' => new SaleResource($sale->load('items.medicine'))
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    public function show(int $id)
    {
        $sale = Sale::with(['items.medicine', 'items.batch'])->find($id);
        if (!$sale) {
            return response()->json(['message' => 'Sale not found'], 404);
        }
        return new SaleResource($sale);
    }

    public function updateStatus(Request $request, Sale $sale): JsonResponse
    {
        $request->validate([
            'status' => 'required|string|in:Completed,Due,Returned',
            'paid_amount' => 'nullable|numeric|min:0',
            'due_amount' => 'nullable|numeric|min:0',
        ]);

        try {
            $oldPaidAmount = $sale->paid_amount;
            
            $sale->update($request->only(['status', 'paid_amount', 'due_amount']));
            
            // Log any new cash collected (e.g., when a Due bill is marked as Paid)
            $newPaidAmount = $sale->paid_amount;
            if ($newPaidAmount > $oldPaidAmount) {
                $difference = $newPaidAmount - $oldPaidAmount;
                \App\Models\CashTransaction::record(
                    'In',
                    $difference,
                    "Due Payment Collected - Invoice {$sale->invoice_number}"
                );
            }
            
            Cache::forget('sales_total_amount');
            Cache::forget('sales_total_due');
            Cache::forget('sales_total_due_customers');
            
            return response()->json([
                'success' => true,
                'message' => 'Sale status updated successfully',
                'data' => new SaleResource($sale)
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }
}
