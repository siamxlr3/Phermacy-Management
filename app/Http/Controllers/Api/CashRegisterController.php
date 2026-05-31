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
     * Get current cash register status with targeted caching.
     */
    public function status(): JsonResponse
    {
        $todayStart = Carbon::today()->toDateTimeString();
        $todayEnd   = Carbon::today()->endOfDay()->toDateTimeString();

        $summary = Cache::tags(['cash', 'dashboard'])->remember('cash_register_status', 3600, function() use ($todayStart, $todayEnd) {
            $stats = CashTransaction::selectRaw("
                SUM(CASE WHEN transaction_type = ? THEN amount ELSE 0 END) as total_in,
                SUM(CASE WHEN transaction_type IN (?,?,?,?) THEN amount 
                         WHEN transaction_type IN (?,?) THEN -amount 
                         ELSE 0 END) as total_out,
                SUM(CASE WHEN transaction_type = ? AND created_at >= ? AND created_at <= ? THEN amount ELSE 0 END) as today_in,
                SUM(CASE WHEN (transaction_type IN (?,?,?,?) OR transaction_type IN (?,?)) AND created_at >= ? AND created_at <= ? THEN 
                            CASE WHEN transaction_type IN (?,?) THEN -amount ELSE amount END
                         ELSE 0 END) as today_out
            ", [
                CashTransaction::TYPE_IN,
                ...CashTransaction::TYPES_OUTFLOW,
                CashTransaction::TYPE_GRN_REVERSAL,
                CashTransaction::TYPE_EXPENSE_REVERSAL,
                CashTransaction::TYPE_IN, $todayStart, $todayEnd,
                ...CashTransaction::TYPES_OUTFLOW,
                CashTransaction::TYPE_GRN_REVERSAL,
                CashTransaction::TYPE_EXPENSE_REVERSAL, $todayStart, $todayEnd,
                CashTransaction::TYPE_GRN_REVERSAL,
                CashTransaction::TYPE_EXPENSE_REVERSAL
            ])->first();

            return [
                'current_balance' => (float) CashTransaction::getCurrentBalance(),
                'total_in'        => (float) ($stats->total_in ?? 0),
                'total_out'       => (float) ($stats->total_out ?? 0),
                'today_in'        => (float) ($stats->today_in ?? 0),
                'today_out'       => (float) ($stats->today_out ?? 0),
            ];
        });

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

        Cache::tags(['cash', 'dashboard'])->flush();

        return response()->json([
            'success' => true,
            'message' => 'Cash transaction recorded successfully',
            'data'    => new CashTransactionResource($transaction)
        ]);
    }
}
