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
use Exception;

class ReturnController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search');
        $fromDate = $request->get('from_date');
        $toDate = $request->get('to_date');

        $query = SalesReturn::with(['sale', 'items.medicine', 'items.batch']);

        if ($search) {
            $query->where('return_invoice_number', 'like', "%{$search}%")
                  ->orWhereHas('sale', function($sq) use ($search) {
                      $sq->where('invoice_number', 'like', "%{$search}%");
                  });
        }

        if ($fromDate && $toDate) {
            $query->whereBetween('return_date', [
                \Carbon\Carbon::parse($fromDate)->startOfDay(),
                \Carbon\Carbon::parse($toDate)->endOfDay()
            ]);
        }

        $returns = $query->orderBy('return_date', 'desc')->paginate($perPage);
        return SalesReturnResource::collection($returns);
    }

    public function lookup(string $invoiceNumber)
    {
        $sale = Sale::with(['items.medicine'])
            ->where('invoice_number', $invoiceNumber)
            ->firstOrFail();

        return new SaleResource($sale);
    }

    public function store(StoreReturnRequest $request)
    {
        $data = $request->validated();

        try {
            $salesReturn = DB::transaction(function () use ($data) {
                $sale = Sale::findOrFail($data['sale_id']);

                $lastReturn = SalesReturn::latest()->first();
                $number = $lastReturn ? (int) substr($lastReturn->return_invoice_number, 4) + 1 : 1;
                $invoiceNumber = 'RET-' . str_pad($number, 6, '0', STR_PAD_LEFT);

                $salesReturn = SalesReturn::create([
                    'sale_id' => $sale->id,
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
                        'customer'
                    );
                    $salesReturn->update(['cash_transaction_id' => $transaction->id]);
                }

                foreach ($data['items'] as $itemData) {
                    $saleItem = SaleItem::findOrFail($itemData['sale_item_id']);
                    
                    $alreadyReturned = $saleItem->returnItems()->sum('qty_returned');
                    if (($alreadyReturned + $itemData['qty_returned']) > $saleItem->qty_tablets) {
                        throw new Exception("Returned quantity exceeds sold quantity.");
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

                    $batch = StockBatch::find($saleItem->stock_batch_id);
                    if ($batch) $batch->increment('qty_tablets_remaining', $itemData['qty_returned']);
                    Medicine::where('id', $saleItem->medicine_id)->increment('stock', $itemData['qty_returned']);
                }

                $totalSold = $sale->items()->sum('qty_tablets');
                $totalReturned = DB::table('sales_return_items')
                    ->join('sales_returns', 'sales_returns.id', '=', 'sales_return_items.sales_return_id')
                    ->where('sales_returns.sale_id', $sale->id)
                    ->sum('qty_returned');

                // Track the net refunded amount on the sale for accurate revenue reporting
                $sale->increment('refunded_amount', $data['total_returned']);

                if ($totalReturned >= $totalSold) {
                    $sale->update(['status' => 'Returned']);
                } else if ($totalReturned > 0) {
                    $sale->update(['status' => 'Partially Returned']);
                }

                // Targeted cache invalidation — clears sale summary cards immediately
                Cache::forget('sales_total_amount');
                Cache::forget('sales_total_completed');
                Cache::forget('sales_total_returned');
                Cache::forget('sales_total_due');
                Cache::forget('sales_total_due_customers');
                Cache::tags(['reports'])->flush();

                return $salesReturn;
            });

            return response()->json([
                'success' => true,
                'message' => 'Return processed successfully',
                'data' => new SalesReturnResource($salesReturn->load(['sale', 'items.medicine']))
            ], 201);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public function show(int $id)
    {
        $return = SalesReturn::with(['sale', 'items.medicine'])->findOrFail($id);
        return new SalesReturnResource($return);
    }
}
