<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalesReturn;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Medicine;
use App\Models\StockBatch;
use Illuminate\Http\Request;
use App\Http\Resources\Api\ReturnResource;
use App\Http\Resources\Api\SaleResource;
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

        $query = SalesReturn::with(['sale', 'items.medicine']);

        if ($search) {
            $query->where('return_invoice_number', 'like', "%{$search}%")
                  ->orWhereHas('sale', function($sq) use ($search) {
                      $sq->where('invoice_number', 'like', "%{$search}%");
                  });
        }

        if ($fromDate && $toDate) {
            $query->whereBetween('return_date', [$fromDate, $toDate]);
        }

        $returns = $query->orderBy('return_date', 'desc')->paginate($perPage);
        return ReturnResource::collection($returns);
    }

    public function findSale(Request $request)
    {
        $invoice = $request->get('invoice');
        $sale = Sale::with(['items.medicine', 'customer'])
            ->where('invoice_number', $invoice)
            ->firstOrFail();

        return new SaleResource($sale);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'sale_id' => 'required|exists:sales,id',
            'reason' => 'required|string',
            'subtotal_returned' => 'required|numeric',
            'tax_returned' => 'nullable|numeric',
            'total_returned' => 'required|numeric',
            'items' => 'required|array',
            'items.*.sale_item_id' => 'required|exists:sale_items,id',
            'items.*.qty_returned' => 'required|integer|min:1',
        ]);

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
                ]);

                foreach ($data['items'] as $itemData) {
                    $saleItem = SaleItem::findOrFail($itemData['sale_item_id']);
                    
                    $alreadyReturned = $saleItem->returnItems()->sum('qty_returned');
                    if (($alreadyReturned + $itemData['qty_returned']) > $saleItem->qty_tablets) {
                        throw new Exception("Returned quantity exceeds sold quantity.");
                    }

                    $salesReturn->items()->create([
                        'sale_item_id' => $saleItem->id,
                        'medicine_id' => $saleItem->medicine_id,
                        'stock_batch_id' => $saleItem->stock_batch_id,
                        'qty_returned' => $itemData['qty_returned'],
                        'unit_price' => $saleItem->unit_price,
                        'tax_amount' => ($saleItem->tax_amount / $saleItem->qty_tablets) * $itemData['qty_returned'],
                        'subtotal' => $saleItem->unit_price * $itemData['qty_returned'],
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

                if ($totalReturned >= $totalSold) {
                    $sale->update(['status' => 'Returned']);
                } else if ($totalReturned > 0) {
                    $sale->update(['status' => 'Partially Returned']);
                }

                Cache::flush();
                return $salesReturn;
            });

            return response()->json([
                'success' => true,
                'message' => 'Return processed successfully',
                'data' => new ReturnResource($salesReturn->load(['sale', 'items.medicine']))
            ], 201);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public function show(int $id)
    {
        $return = SalesReturn::with(['sale', 'items.medicine'])->findOrFail($id);
        return new ReturnResource($return);
    }
}
