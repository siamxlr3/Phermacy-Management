<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashTransaction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Resources\Api\CashTransactionResource;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Carbon\Carbon;

class CashRegisterController extends Controller
{
    /**
     * Get the transaction ledger with full metadata.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = min($request->integer('per_page', 10), 100);
        $query = CashTransaction::with('user:id,name');

        if ($request->filled('from')) {
            $query->where('created_at', '>=', Carbon::parse($request->from)->startOfDay());
        }
        if ($request->filled('to')) {
            $query->where('created_at', '<=', Carbon::parse($request->to)->endOfDay());
        }

        // Default to showing only outflows (including reversals) if no type is specified or 'outflow' requested
        if (!$request->filled('transaction_type') || $request->transaction_type === 'outflow') {
            $query->whereIn('transaction_type', [
                ...CashTransaction::TYPES_OUTFLOW, 
                CashTransaction::TYPE_GRN_REVERSAL,
                CashTransaction::TYPE_EXPENSE_REVERSAL
            ]);
        } elseif ($request->transaction_type !== 'all') {
            $query->where('transaction_type', $request->transaction_type);
        }

        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }
        if ($request->filled('reference_type')) {
            $query->where('reference_type', $request->reference_type);
        }

        $transactions = $query->latest('id')->paginate($perPage);
        return CashTransactionResource::collection($transactions);
    }

    /**
     * Get current cash register status with targeted caching and date filtering.
     */
    public function status(Request $request): JsonResponse
    {
        $from = $request->filled('from') ? Carbon::parse($request->from)->startOfDay() : null;
        $to   = $request->filled('to')   ? Carbon::parse($request->to)->endOfDay()     : null;

        $cacheKey = 'cash_register_status_' . ($from?->toDateString() ?? 'all') . '_' . ($to?->toDateString() ?? 'all');

        $callback = function() use ($from, $to) {
            return app(\App\Queries\CashRegisterStatusQuery::class)->getSummary($from, $to);
        };

        if (Cache::getStore() instanceof \Illuminate\Cache\TaggableStore) {
            $summary = Cache::tags(['cash', 'dashboard'])->remember($cacheKey, 3600, $callback);
        } else {
            $summary = Cache::remember($cacheKey, 3600, $callback);
        }

        return response()->json([
            'success' => true,
            'is_open' => true,
            'summary' => $summary
        ]);
    }

    /**
     * Manual cash adjustment (e.g. opening float, withdrawal).
     */
    public function store(Request $request): JsonResponse
    {
        $types = implode(',', [
            CashTransaction::TYPE_IN,
            CashTransaction::TYPE_OUT,
            CashTransaction::TYPE_SALE_REFUND,
            CashTransaction::TYPE_EXPENSE,
            CashTransaction::TYPE_GRN_PAYMENT
        ]);

        $data = $request->validate([
            'transaction_type' => "required|in:{$types}",
            'amount'           => 'required|numeric|min:0.01',
            'description'      => 'required|string|max:255',
            'payment_method'   => 'nullable|in:cash,card,online,due',
            'reference_type'   => 'nullable|string|max:50',
            'reference_id'     => 'nullable|integer',
            'reference_number' => 'nullable|string|max:50',
            'party_name'       => 'nullable|string|max:255',
            'party_type'       => 'nullable|in:customer,supplier,other',
        ]);

        $transaction = CashTransaction::record(
            $data['transaction_type'],
            $data['amount'],
            $data['description'],
            $data['reference_type'] ?? null,
            $data['reference_id'] ?? null,
            $data['reference_number'] ?? null,
            $data['payment_method'] ?? 'cash',
            $data['party_name'] ?? null,
            $data['party_type'] ?? 'other',
            Auth::id()
        );

        if (Cache::getStore() instanceof \Illuminate\Cache\TaggableStore) {
            Cache::tags(['cash', 'dashboard'])->flush();
        } else {
            Cache::flush();
        }

        return response()->json([
            'success' => true,
            'message' => 'Cash transaction recorded successfully',
            'data'    => new CashTransactionResource($transaction)
        ]);
    }
}
