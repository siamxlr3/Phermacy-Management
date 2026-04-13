<?php

namespace App\Services;

use App\Repositories\SaleRepository;
use App\Models\Medicine;
use App\Models\StockBatch;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Exception;

class SaleService
{
    protected $saleRepository;
    protected $alertService;

    public function __construct(SaleRepository $saleRepository, AlertService $alertService)
    {
        $this->saleRepository = $saleRepository;
        $this->alertService = $alertService;
    }

    /**
     * Process a new POS sale with FIFO stock deduction
     */
    public function processSale(array $data): Sale
    {
        return DB::transaction(function () use ($data) {
            // 1. Create the Sale Record
            $sale = $this->saleRepository->create([
                'user_id' => auth()->id() ?? (User::first()->id ?? null),
                'invoice_number' => $this->saleRepository->generateInvoiceNumber(),
                'sale_date' => now(),
                'subtotal' => $data['subtotal'],
                'tax_total' => $data['tax_total'] ?? 0,
                'discount_total' => $data['discount_total'] ?? 0,
                'grand_total' => $data['grand_total'],
                'payment_method' => $data['payment_method'] ?? 'Cash',
                'status' => 'Completed',
                'notes' => $data['notes'] ?? null,
            ]);

            // 2. Process Line Items with FIFO
            foreach ($data['items'] as $item) {
                $this->deductStockFIFO($sale, $item);
                
                // Real-time Critical Stock Alert
                $medicine = Medicine::find($item['medicine_id']);
                $this->alertService->triggerLowStockCheck($medicine);
            }

            // 3. Invalidate relevant caches
            $this->clearCaches($data['items']);

            return $sale;
        });
    }

    /**
     * FIFO Logic: Deduct from oldest non-expired batches first
     */
    private function deductStockFIFO(Sale $sale, array $itemData)
    {
        $medicineId = $itemData['medicine_id'];
        $remainingToDeduct = $itemData['qty_tablets'];

        // Get active batches sorted by expiry (FIFO)
        $batches = StockBatch::where('medicine_id', $medicineId)
            ->where('qty_tablets_remaining', '>', 0)
            ->where('expiry_date', '>', now())
            ->orderBy('expiry_date', 'asc')
            ->get();

        if ($batches->sum('qty_tablets_remaining') < $remainingToDeduct) {
            $medicine = Medicine::find($medicineId);
            throw new Exception("Insufficient stock for {$medicine->name}. Required: {$remainingToDeduct}, Available: " . $batches->sum('qty_tablets_remaining'));
        }

        foreach ($batches as $batch) {
            if ($remainingToDeduct <= 0) break;

            $deductFromThisBatch = min($batch->qty_tablets_remaining, $remainingToDeduct);

            // Create Sale Item linked to this specific batch
            $this->saleRepository->createItem([
                'sale_id' => $sale->id,
                'medicine_id' => $medicineId,
                'sale_unit' => $itemData['sale_unit'] ?? 'Tablet',
                'stock_batch_id' => $batch->id,
                'qty_tablets' => $deductFromThisBatch,
                'unit_price' => $itemData['unit_price'], // Price per tablet
                'tax_amount' => ($itemData['tax_amount'] / $itemData['qty_tablets']) * $deductFromThisBatch,
                'subtotal' => ($itemData['unit_price'] * $deductFromThisBatch),
            ]);

            // Update Batch
            $batch->decrement('qty_tablets_remaining', $deductFromThisBatch);
            
            // Update Medicine master stock
            Medicine::where('id', $medicineId)->decrement('stock', $deductFromThisBatch);

            $remainingToDeduct -= $deductFromThisBatch;
        }
    }

    public function getSalesHistory(int $perPage = 10, ?string $search = null, ?string $status = null)
    {
        return $this->saleRepository->getSaleList($perPage, $search, $status);
    }

    public function getSaleDetails(int $id)
    {
        return $this->saleRepository->findById($id);
    }

    private function clearCaches(array $items)
    {
        Cache::forget('stock_overview');
        Cache::forget('stock_batches');
        // Clear report cache on new sale
        Cache::flush(); 
        foreach ($items as $item) {
            Cache::forget("medicine_details_{$item['medicine_id']}");
        }
    }
}
