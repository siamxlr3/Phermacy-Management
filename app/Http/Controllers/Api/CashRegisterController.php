<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashTransaction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class CashRegisterController extends Controller
{
    /**
     * Get the transaction ledger.
     */
    public function index(Request $request): JsonResponse
    {
        $query = CashTransaction::query();

        // FIX 1: Index-friendly date filtering (no SQL functions on the column)
        if ($request->filled('from')) {
            $query->where('created_at', '>=', Carbon::parse($request->from)->startOfDay());
        }
        if ($request->filled('to')) {
            $query->where('created_at', '<=', Carbon::parse($request->to)->endOfDay());
        }
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // FIX 2: simplePaginate is much faster for endless ledgers, limits memory exhaustion
        $transactions = $query->latest('id')->simplePaginate(50);

        return response()->json([
            'success' => true,
            'data' => $transactions
        ]);
    }

    /**
     * Get current cash status (Running Balance, Total In, Total Out).
     */
    public function status(): JsonResponse
    {
        $today = Carbon::today()->toDateString();
        
        // FIX 3: Combine 4 full-table scans into a single highly optimized SQL aggregation
        $summary = CashTransaction::selectRaw("
            SUM(CASE WHEN type = 'In' THEN amount ELSE 0 END) as total_in,
            SUM(CASE WHEN type = 'Out' THEN amount ELSE 0 END) as total_out,
            SUM(CASE WHEN type = 'In' AND DATE(created_at) = ? THEN amount ELSE 0 END) as today_in,
            SUM(CASE WHEN type = 'Out' AND DATE(created_at) = ? THEN amount ELSE 0 END) as today_out
        ", [$today, $today])->first();

        return response()->json([
            'success' => true,
            'is_open' => true, // POS always active
            'summary' => [
                'current_balance' => CashTransaction::getCurrentBalance(),
                'total_in' => (float) ($summary->total_in ?? 0),
                'total_out' => (float) ($summary->total_out ?? 0),
                'today_in' => (float) ($summary->today_in ?? 0),
                'today_out' => (float) ($summary->today_out ?? 0),
            ]
        ]);
    }

    /**
     * Manual adjustment (e.g. adding initial cash or withdrawing).
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'type' => 'required|in:In,Out',
            'amount' => 'required|numeric|min:0.01',
            'items' => 'required|string|max:255',
        ]);

        $transaction = CashTransaction::record(
            $request->type,
            $request->amount,
            $request->items
        );

        return response()->json([
            'success' => true,
            'message' => 'Cash transaction recorded successfully',
            'data' => $transaction
        ]);
    }
}
