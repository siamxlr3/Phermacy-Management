<?php

namespace App\Services;

use App\Repositories\ReturnRepository;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Medicine;
use App\Models\StockBatch;
use App\Models\SalesReturn;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Exception;

class ReturnService
{
    protected $returnRepository;

    public function __construct(ReturnRepository $returnRepository)
    {
        $this->returnRepository = $returnRepository;
    }

    /**
     * Process a sale return and re-credit stock
     */
    public function processReturn(array $data): SalesReturn
    {
        return DB::transaction(function () use ($data) {
            $sale = Sale::findOrFail($data['sale_id']);

            // 1. Create Return Header
            $salesReturn = $this->returnRepository->createReturn([
                'sale_id' => $sale->id,
                'return_invoice_number' => $this->returnRepository->generateReturnInvoiceNumber(),
                'return_date' => now(),
                'subtotal_returned' => $data['subtotal_returned'],
                'tax_returned' => $data['tax_returned'] ?? 0,
                'total_returned' => $data['total_returned'],
                'reason' => $data['reason'],
            ]);

            // 2. Process Items
            foreach ($data['items'] as $item) {
                $this->processReturnItem($salesReturn, $item);
            }

            // 3. Update Original Sale Status
            $this->updateSaleStatus($sale);

            // 4. Invalidate relevant caches
            $this->clearCaches($sale);

            return $salesReturn;
        });
    }

    private function processReturnItem($salesReturn, array $itemData)
    {
        $saleItem = SaleItem::findOrFail($itemData['sale_item_id']);
        
        // Validation: Verify if the return quantity is valid
        $alreadyReturned = $saleItem->returnItems()->sum('qty_returned');
        if (($alreadyReturned + $itemData['qty_returned']) > $saleItem->qty_tablets) {
            throw new Exception("Returned quantity exceeds original sold quantity for {$saleItem->medicine->name}");
        }

        // Create Return Item
        $this->returnRepository->createReturnItem([
            'sales_return_id' => $salesReturn->id,
            'sale_item_id' => $saleItem->id,
            'medicine_id' => $saleItem->medicine_id,
            'stock_batch_id' => $saleItem->stock_batch_id,
            'qty_returned' => $itemData['qty_returned'],
            'unit_price' => $saleItem->unit_price,
            'tax_amount' => ($saleItem->tax_amount / $saleItem->qty_tablets) * $itemData['qty_returned'],
            'subtotal' => $saleItem->unit_price * $itemData['qty_returned'],
        ]);

        // Re-credit Stock to Batch
        $batch = StockBatch::find($saleItem->stock_batch_id);
        if ($batch) {
            $batch->increment('qty_tablets_remaining', $itemData['qty_returned']);
        }

        // Re-credit Medicine Master Stock
        Medicine::where('id', $saleItem->medicine_id)->increment('stock', $itemData['qty_returned']);
    }

    private function updateSaleStatus(Sale $sale)
    {
        $totalSold = $sale->items()->sum('qty_tablets');
        $totalReturned = DB::table('sales_return_items')
            ->join('sales_returns', 'sales_returns.id', '=', 'sales_return_items.sales_return_id')
            ->where('sales_returns.sale_id', $sale->id)
            ->sum('qty_returned');

        if ($totalReturned >= $totalSold) {
            $sale->update(['status' => 'Returned']);
        } elseif ($totalReturned > 0) {
            $sale->update(['status' => 'Partially Returned']);
        }
    }

    public function getReturnHistory(int $perPage = 10, ?string $search = null, ?string $fromDate = null, ?string $toDate = null)
    {
        return $this->returnRepository->getReturnList($perPage, $search, $fromDate, $toDate);
    }

    public function findReturnDetails(int $id)
    {
        return $this->returnRepository->findReturnById($id);
    }

    public function getSaleForReturn(string $invoiceNumber)
    {
        return $this->returnRepository->findSaleByInvoice($invoiceNumber);
    }

    private function clearCaches(Sale $sale)
    {
        Cache::forget('stock_overview');
        Cache::forget('stock_batches');
        foreach ($sale->items as $item) {
            Cache::forget("medicine_details_{$item->medicine_id}");
        }
    }
}
