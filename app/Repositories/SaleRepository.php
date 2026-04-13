<?php

namespace App\Repositories;

use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Pagination\LengthAwarePaginator;

class SaleRepository
{
    public function getSaleList(int $perPage = 10, ?string $search = null, ?string $status = null): LengthAwarePaginator
    {
        $query = Sale::with(['items.medicine']);

        if ($search) {
            $query->where('invoice_number', 'like', "%{$search}%");
        }

        if ($status) {
            $query->where('status', $status);
        }

        return $query->latest('sale_date')->paginate($perPage);
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

    public function generateInvoiceNumber(): string
    {
        $lastSale = Sale::latest()->first();
        $number = $lastSale ? (int) substr($lastSale->invoice_number, 4) + 1 : 1;
        return 'INV-' . str_pad($number, 6, '0', STR_PAD_LEFT);
    }
}
