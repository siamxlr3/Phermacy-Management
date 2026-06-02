<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalesReturn;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Medicine;
use App\Models\StockBatch;
use Illuminate\Http\Request;
use App\Http\Resources\Api\SalesReturnResource;
use App\Http\Resources\Api\SaleResource;
use App\Http\Requests\Api\StoreReturnRequest;
use App\Models\CashTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Exception;

class ReturnController extends Controller
{
    /**
     * List returns with optimized eager loading and simple pagination.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = min($request->integer('per_page', 10), 100);
        $search = $request->get('search');
        $fromDate = $request->get('from_date');
        $toDate = $request->get('to_date');

        $query = SalesReturn::with([
            'sale:id,invoice_number,customer_name', 
            'items.medicine:id,medicine_name,dosage_form,tablets_per_strip,strips_per_box', 
            'items.batch:id,batch_number',
            'user:id,name'
        ]);

        if ($search) {
            $query->where('return_invoice_number', 'like', "{$search}%")
                  ->orWhereHas('sale', function($sq) use ($search) {
                      $sq->where('invoice_number', 'like', "{$search}%");
                  });
        }

        if ($fromDate && $toDate) {
            $query->whereBetween('return_date', [
                \Carbon\Carbon::parse($fromDate)->startOfDay(),
                \Carbon\Carbon::parse($toDate)->endOfDay()
            ]);
        }

        $returns = $query->latest('return_date')->paginate($perPage);
        return SalesReturnResource::collection($returns);
    }

    /**
     * Specialized lookup for a sale to be returned.
     */
    public function lookup(string $invoiceNumber): JsonResponse
    {
        $sale = Sale::with(['items.medicine:id,medicine_name,dosage_form,tablets_per_strip,strips_per_box', 'items.returnItems'])
            ->where('invoice_number', $invoiceNumber)
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => new SaleResource($sale)
        ]);
    }

    /**
     * Process a return with full inventory and financial reconciliation.
     */
    public function store(StoreReturnRequest $request): JsonResponse
    {
        $data = $request->validated();

        try {
            $salesReturn = DB::transaction(function () use ($data) {
                $sale = Sale::findOrFail($data['sale_id']);

                // 1. Atomic Invoice Generation
                $lastReturn = DB::table('sales_returns')->lockForUpdate()->latest('id')->first();
                $number = $lastReturn ? (int) substr($lastReturn->return_invoice_number, 4) + 1 : 1;
                $invoiceNumber = 'RET-' . str_pad($number, 6, '0', STR_PAD_LEFT);

                $salesReturn = SalesReturn::create([
                    'sale_id' => $sale->id,
                    'user_id' => Auth::id(),
                    'return_invoice_number' => $invoiceNumber,
                    'return_date' => now(),
                    'subtotal_returned' => $data['subtotal_returned'],
                    'tax_returned' => $data['tax_returned'] ?? 0,
                    'total_returned' => $data['total_returned'],
                    'reason' => $data['reason'],
                    'refund_method' => $data['refund_method'],
                    'original_payment_method' => $data['original_payment_method'],
                    'return_type' => $data['return_type'],
                ]);

                // 2. Financial Integration
                if ($data['refund_method'] === 'cash') {
                    $transaction = CashTransaction::record(
                        'sale_refund',
                        $data['total_returned'],
                        "Refund for Return Invoice {$invoiceNumber}",
                        'sale_return',
                        $salesReturn->id,
                        $invoiceNumber,
                        'cash',
                        $sale->customer_name ?? 'Walk-in Customer',
                        'customer',
                        Auth::id()
                    );
                    $salesReturn->update(['cash_transaction_id' => $transaction->id]);
                }

                // 3. Inventory Reversal
                foreach ($data['items'] as $itemData) {
                    $saleItem = SaleItem::with('returnItems')->findOrFail($itemData['sale_item_id']);
                    
                    $alreadyReturned = $saleItem->returnItems->sum('qty_returned');
                    if (($alreadyReturned + $itemData['qty_returned']) > $saleItem->qty_tablets) {
                        throw new Exception("Returned quantity exceeds sold quantity for item: " . ($saleItem->medicine->medicine_name ?? $saleItem->id));
                    }

                    $salesReturn->items()->create([
                        'sale_item_id'     => $saleItem->id,
                        'medicine_id'      => $saleItem->medicine_id,
                        'stock_batch_id'   => $saleItem->stock_batch_id,
                        'qty_returned'     => $itemData['qty_returned'],
                        'sale_unit'        => $saleItem->sale_unit ?? 'unit',
                        'unit_price'       => $saleItem->unit_price,
                        'subtotal'         => $saleItem->unit_price * $itemData['qty_returned'],
                        'return_condition' => $itemData['return_condition'] ?? 'resellable',
                    ]);

                    // Only put back to stock if resellable
                    if (($itemData['return_condition'] ?? 'resellable') === 'resellable') {
                        // Use save() (not increment()) so the saving event fires and
                        // calculateValuation() correctly updates total_cost_value.
                        $returnedTablets = $itemData['qty_returned'];
                        $batch = StockBatch::find($saleItem->stock_batch_id);
                        if ($batch) {
                            $tabletsPerBox = ($batch->qty_boxes > 0)
                                ? ((float) $batch->qty_tablets / (float) $batch->qty_boxes)
                                : 1;

                            $batch->qty_tablets_remaining += $returnedTablets;
                            if ($batch->qty_boxes_remaining !== null && $tabletsPerBox > 0) {
                                $batch->qty_boxes_remaining = round(
                                    (float) $batch->qty_tablets_remaining / $tabletsPerBox,
                                    4
                                );
                            }
                            $batch->save(); // triggers saving → calculateValuation() → total_cost_value updated
                        }
                        Medicine::where('id', $saleItem->medicine_id)->increment('stock', $returnedTablets);
                    }
                }

                // 4. Update Sale Totals and Status
                $sale->increment('refunded_amount', $data['total_returned']);
                $sale->increment('refunded_subtotal', $data['subtotal_returned']);

                // Optimized status check: Avoid loading all items again
                $saleTotals = $sale->items()
                    ->selectRaw('SUM(qty_tablets) as total_sold')
                    ->first();
                
                $returnTotals = DB::table('sales_return_items')
                    ->join('sales_returns', 'sales_return_items.sales_return_id', '=', 'sales_returns.id')
                    ->where('sales_returns.sale_id', $sale->id)
                    ->selectRaw('SUM(qty_returned) as total_returned')
                    ->first();

                if (($returnTotals->total_returned ?? 0) >= ($saleTotals->total_sold ?? 0)) {
                    $sale->update(['status' => 'Returned']);
                } else if (($returnTotals->total_returned ?? 0) > 0) {
                    $sale->update(['status' => 'Partially Returned']);
                }

                // 5. Targeted Cache Invalidation (Avoid global flush)
                Cache::forget("sale_details_{$sale->id}");
                Cache::forget("sales_list_page_*"); // Better than flushing everything
                // If using tags, flush only specific necessary tags
                // Cache::tags(['reports'])->flush(); 

                return $salesReturn;
            });

            return response()->json([
                'success' => true,
                'message' => 'Return processed successfully',
                'data' => new SalesReturnResource($salesReturn->load(['sale', 'items.medicine', 'items.batch']))
            ], 201);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * Show return details.
     */
    public function show(int $id): JsonResponse
    {
        $return = SalesReturn::with(['sale', 'items.medicine', 'user:id,name'])->findOrFail($id);
        return response()->json([
            'success' => true,
            'data' => new SalesReturnResource($return)
        ]);
    }
}
