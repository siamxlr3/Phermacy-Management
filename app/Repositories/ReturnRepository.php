<?php

namespace App\Repositories;

use App\Models\SalesReturn;
use App\Models\SalesReturnItem;
use App\Models\Sale;
use Illuminate\Pagination\LengthAwarePaginator;

class ReturnRepository
{
    public function getReturnList(int $perPage = 10, ?string $search = null, ?string $fromDate = null, ?string $toDate = null): LengthAwarePaginator
    {
        $query = SalesReturn::with(['sale', 'items.medicine']);

        if ($search) {
            $query->where('return_invoice_number', 'like', "%{$search}%");
        }

        if ($fromDate && $toDate) {
            $query->whereBetween('return_date', [$fromDate . ' 00:00:00', $toDate . ' 23:59:59']);
        }

        return $query->latest('return_date')->paginate($perPage);
    }

    public function findReturnById(int $id): ?SalesReturn
    {
        return SalesReturn::with(['sale', 'items.medicine', 'items.batch'])->find($id);
    }

    public function findSaleByInvoice(string $invoiceNumber): ?Sale
    {
        return Sale::with(['items.medicine', 'items.batch', 'items.returnItems'])->where('invoice_number', $invoiceNumber)->first();
    }

    public function createReturn(array $data): SalesReturn
    {
        return SalesReturn::create($data);
    }

    public function createReturnItem(array $data): SalesReturnItem
    {
        return SalesReturnItem::create($data);
    }

    public function generateReturnInvoiceNumber(): string
    {
        $lastReturn = SalesReturn::latest()->first();
        $number = $lastReturn ? (int) substr($lastReturn->return_invoice_number, 4) + 1 : 1;
        return 'RET-' . str_pad($number, 6, '0', STR_PAD_LEFT);
    }
}
