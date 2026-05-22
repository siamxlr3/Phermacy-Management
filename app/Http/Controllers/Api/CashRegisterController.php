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

        // Default to showing only sale_refund, expense, and grn_payment if no type is specified or 'outflow' requested
        if (!$request->filled('transaction_type') || $request->transaction_type === 'outflow') {
            $query->whereIn('transaction_type', ['sale_refund', 'expense', 'grn_payment', 'Out']);
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
        $today = Carbon::today()->toDateString();

        $summary = Cache::tags(['cash', 'dashboard'])->remember('cash_register_status', 3600, function() use ($today) {
            return CashTransaction::selectRaw("
                SUM(CASE WHEN transaction_type IN ('In') THEN amount ELSE 0 END) as total_in,
                SUM(CASE WHEN transaction_type IN ('Out','sale_refund','expense','grn_payment') THEN amount ELSE 0 END) as total_out,
                SUM(CASE WHEN transaction_type IN ('In') AND DATE(created_at) = ? THEN amount ELSE 0 END) as today_in,
                SUM(CASE WHEN transaction_type IN ('Out','sale_refund','expense','grn_payment') AND DATE(created_at) = ? THEN amount ELSE 0 END) as today_out
            ", [$today, $today])->first();
        });

        return response()->json([
            'success' => true,
            'is_open' => true,
            'summary' => [
                'current_balance' => (float) CashTransaction::getCurrentBalance(),
                'total_in'        => (float) ($summary->total_in ?? 0),
                'total_out'       => (float) ($summary->total_out ?? 0),
                'today_in'        => (float) ($summary->today_in ?? 0),
                'today_out'       => (float) ($summary->today_out ?? 0),
            ]
        ]);
    }

    /**
     * Manual cash adjustment (e.g. opening float, withdrawal).
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'transaction_type' => 'required|in:In,Out,sale_refund,expense',
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
