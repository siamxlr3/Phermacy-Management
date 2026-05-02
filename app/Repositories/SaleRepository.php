<?php

namespace App\Repositories;

use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Pagination\LengthAwarePaginator;

class SaleRepository
{
    public function getSaleList(int $perPage = 10, ?string $search = null, ?string $status = null): array
    {
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

        // Calculate totals for the filtered results (before pagination)
        $totalAmount = (clone $query)->sum('grand_total');
        $totalDue = (clone $query)->sum('due_amount');

        $paginator = $query->latest('sale_date')->paginate($perPage);

        return [
            'paginator' => $paginator,
            'total_amount' => $totalAmount,
            'total_due' => $totalDue
        ];
    }

    public function findById(int $id): ?Sale
    {
        return Sale::with(['items.medicine', 'items.batch'])->find($id);
    }

    public function create(array $data): Sale
    {
        return Sale::create($data);
    }

    public function createItem(array $data): SaleItem
    {
        return SaleItem::create($data);
    }

    public function update(int $id, array $data): Sale
    {
        $sale = Sale::findOrFail($id);
        $sale->update($data);
        return $sale;
    }

    public function generateInvoiceNumber(): string
    {
        $lastSale = Sale::latest()->first();
        $number = $lastSale ? (int) substr($lastSale->invoice_number, 4) + 1 : 1;
        return 'INV-' . str_pad($number, 6, '0', STR_PAD_LEFT);
    }
}
