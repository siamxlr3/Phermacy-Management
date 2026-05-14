<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashTransaction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class CashRegisterController extends Controller
{
    /**
     * Get the transaction ledger with full metadata.
     */
    public function index(Request $request): JsonResponse
    {
        $query = CashTransaction::query();

        if ($request->filled('from')) {
            $query->where('created_at', '>=', Carbon::parse($request->from)->startOfDay());
        }
        if ($request->filled('to')) {
            $query->where('created_at', '<=', Carbon::parse($request->to)->endOfDay());
        }

        // Default to showing only outflow types (Out, Sale Refund, Expense)
        if (!$request->filled('transaction_type')) {
            $query->whereIn('transaction_type', ['Out', 'sale_refund', 'expense']);
        } else {
            $query->where('transaction_type', $request->transaction_type);
        }

        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }
        if ($request->filled('reference_type')) {
            $query->where('reference_type', $request->reference_type);
        }

        $transactions = $query->latest('id')->simplePaginate(50);

        return response()->json(['success' => true, 'data' => $transactions]);
    }

    /**
     * Get current cash register status.
     */
    public function status(): JsonResponse
    {
        $today = Carbon::today()->toDateString();

        $summary = CashTransaction::selectRaw("
            SUM(CASE WHEN transaction_type IN ('In') THEN amount ELSE 0 END) as total_in,
            SUM(CASE WHEN transaction_type IN ('Out','sale_refund','expense') THEN amount ELSE 0 END) as total_out,
            SUM(CASE WHEN transaction_type IN ('In') AND DATE(created_at) = ? THEN amount ELSE 0 END) as today_in,
            SUM(CASE WHEN transaction_type IN ('Out','sale_refund','expense') AND DATE(created_at) = ? THEN amount ELSE 0 END) as today_out
        ", [$today, $today])->first();

        return response()->json([
            'success' => true,
            'is_open' => true,
            'summary' => [
                'current_balance' => CashTransaction::getCurrentBalance(),
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
            $data['party_type'] ?? 'other'
        );

        return response()->json([
            'success' => true,
            'message' => 'Cash transaction recorded successfully',
            'data'    => $transaction
        ]);
    }
}
