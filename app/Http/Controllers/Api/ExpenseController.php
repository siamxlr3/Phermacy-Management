<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\ExpenseItem;
use Illuminate\Http\Request;
use App\Http\Requests\Api\ExpenseRequest;
use App\Http\Resources\Api\ExpenseResource;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use App\Models\CashTransaction;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ExpenseController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = $request->get('per_page', 10);
        // FIX: hard limit per_page to prevent memory exhaustion
        if ($perPage > 100) $perPage = 100;

        $search = $request->get('search');
        $status = $request->get('status');
        $fromDate = $request->get('from_date');
        $toDate = $request->get('to_date');

        $query = Expense::with(['items']);

        if ($search) {
            $query->where(function($q) use ($search) {
                // Optimized: trailing wildcard only for better index usage
                $q->where('transaction_id', 'like', "{$search}%")
                  ->orWhere('supplier_name', 'like', "{$search}%");
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($fromDate && $toDate) {
            $query->whereBetween('expense_date', [$fromDate, $toDate]);
        }

        $expenses = $query->latest('expense_date')->paginate($perPage);

        return ExpenseResource::collection($expenses);
    }

    public function summary(): JsonResponse
    {
        $today = now()->toDateString();

        $data = Cache::tags(['expenses', 'reports'])->remember('expense_summary_' . $today, 3600, function() use ($today) {
            // FIX 1: Convert 4 separate queries into a single aggregation query
            // Optimized: Direct date comparison instead of DATE() function for index usage
            $summary = Expense::selectRaw("
                SUM(grand_total) as total_expenses,
                SUM(CASE WHEN status = 'Paid' THEN grand_total ELSE 0 END) as total_paid,
                SUM(CASE WHEN status = 'Unpaid' THEN grand_total ELSE 0 END) as total_unpaid,
                SUM(CASE WHEN expense_date = ? THEN grand_total ELSE 0 END) as today_expenses
            ", [$today])->first();

            return [
                'total_expenses' => (float) ($summary->total_expenses ?? 0),
                'total_paid' => (float) ($summary->total_paid ?? 0),
                'total_unpaid' => (float) ($summary->total_unpaid ?? 0),
                'today_expenses' => (float) ($summary->today_expenses ?? 0),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    public function store(ExpenseRequest $request): JsonResponse
    {
        $data = $request->validated();

        try {
            $expense = DB::transaction(function () use ($data) {
                // FIX 2: Race-condition safe ID generation using lockForUpdate()
                $lastExpense = DB::table('expenses')->lockForUpdate()->latest('id')->first();
                $number = $lastExpense && isset($lastExpense->transaction_id) 
                    ? (int) substr($lastExpense->transaction_id, 4) + 1 
                    : 1;
                $transactionId = 'EXP-' . str_pad($number, 6, '0', STR_PAD_LEFT);

                // FIX 7: Server-side calculation to prevent price manipulation
                $items = collect($data['items'])->map(function ($item) {
                    $qty = (int) $item['qty'];
                    $price = (float) $item['price'];
                    return [
                        'items_name' => $item['items_name'],
                        'category' => $item['category'],
                        'qty' => $qty,
                        'price' => $price,
                        'total_price' => $qty * $price,
                    ];
                });

                $grandTotal = $items->sum('total_price');

                $expense = Expense::create([
                    'transaction_id' => $transactionId,
                    'supplier_name' => $data['supplier_name'],
                    'contact_person' => $data['contact_person'] ?? null,
                    'phone' => $data['phone'] ?? null,
                    'address' => $data['address'] ?? null,
                    'expense_date' => $data['expense_date'],
                    'status' => $data['status'],
                    'grand_total' => $grandTotal,
                ]);

                // FIX 3: Bulk Insertion for items (replaces N+1 loop)
                $expense->items()->createMany($items->toArray());

                // FIX 4: Only clear expense and report caches, not the whole system
                Cache::tags(['expenses', 'reports', 'cash'])->flush();

                // Record Cash Transaction if Paid
                if ($expense->status === 'Paid') {
                    $itemNames = collect($data['items'])->pluck('items_name')->join(', ');
                    CashTransaction::record(
                        'expense',
                        $expense->grand_total,
                        "{$itemNames} ({$expense->transaction_id})",
                        'expense',
                        $expense->id,
                        $expense->transaction_id,
                        'cash',
                        $expense->supplier_name,
                        'supplier'
                    );
                }

                return $expense;
            });

            return response()->json([
                'success' => true,
                'message' => 'Expense created successfully',
                'data' => new ExpenseResource($expense->load('items'))
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public function show(int $id): ExpenseResource
    {
        $expense = Expense::with(['items'])->findOrFail($id);
        return new ExpenseResource($expense);
    }

    public function update(ExpenseRequest $request, int $id): JsonResponse
    {
        $expense = Expense::findOrFail($id);
        $data = $request->validated();

        try {
            $expense = DB::transaction(function () use ($expense, $data) {
                $oldStatus = $expense->status;
                $oldTotal  = (float) $expense->grand_total;

                // FIX 7: Server-side calculation — compute new values BEFORE update
                $items = collect($data['items'])->map(function ($item) {
                    $qty   = (int)   $item['qty'];
                    $price = (float) $item['price'];
                    return [
                        'items_name'  => $item['items_name'],
                        'category'    => $item['category'],
                        'qty'         => $qty,
                        'price'       => $price,
                        'total_price' => $qty * $price,
                    ];
                });

                $newTotal  = (float) $items->sum('total_price');
                $newStatus = $data['status'];

                // FIX 5 (corrected): Compare old vs NEW values — not old vs old
                $financialsChanged = ($oldStatus !== $newStatus)
                    || ($oldStatus === 'Paid' && $oldTotal != $newTotal);

                // If it was previously Paid, reverse the original amount first
                if ($financialsChanged && $oldStatus === 'Paid') {
                    CashTransaction::record(
                        CashTransaction::TYPE_EXPENSE_REVERSAL,
                        $oldTotal,
                        "Reversal of Edited Expense ({$expense->transaction_id})",
                        'expense',
                        $expense->id,
                        $expense->transaction_id,
                        'cash',
                        $expense->supplier_name,
                        'supplier'
                    );
                }

                $expense->update([
                    'supplier_name'  => $data['supplier_name'],
                    'contact_person' => $data['contact_person'] ?? null,
                    'phone'          => $data['phone'] ?? null,
                    'address'        => $data['address'] ?? null,
                    'expense_date'   => $data['expense_date'],
                    'status'         => $newStatus,
                    'grand_total'    => $newTotal,
                ]);

                // FIX 8: Force delete old items to prevent SoftDelete bloat
                $expense->items()->forceDelete();
                $expense->items()->createMany($items->toArray());

                Cache::tags(['expenses', 'reports', 'cash'])->flush();

                // Record the new outflow if the expense is now Paid and financials changed
                if ($financialsChanged && $newStatus === 'Paid') {
                    $itemNames = collect($data['items'])->pluck('items_name')->join(', ');
                    CashTransaction::record(
                        'expense',
                        $newTotal,
                        "Updated Expense ({$expense->transaction_id})",
                        'expense',
                        $expense->id,
                        $expense->transaction_id,
                        'cash',
                        $expense->supplier_name,
                        'supplier'
                    );
                }

                return $expense;
            });

            return response()->json([
                'success' => true,
                'message' => 'Expense updated successfully',
                'data' => new ExpenseResource($expense->fresh('items'))
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        $expense = Expense::findOrFail($id);
        
        try {
            DB::transaction(function () use ($expense) {
                // FIX 6: If it was paid, we MUST reverse the cash transaction
                if ($expense->status === 'Paid') {
                    CashTransaction::record(
                        CashTransaction::TYPE_EXPENSE_REVERSAL,
                        $expense->grand_total,
                        "Reversal of Deleted Expense ({$expense->transaction_id})",
                        'expense',
                        $expense->id,
                        $expense->transaction_id,
                        'cash',
                        $expense->supplier_name,
                        'supplier'
                    );
                }

                // Delete items and expense (SoftDeletes protects audit history)
                $expense->items()->delete();
                $expense->delete();

                Cache::tags(['expenses', 'reports', 'cash'])->flush();
            });

            return response()->json(['success' => true, 'message' => 'Expense deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }
}
