<?php

namespace App\Queries;

use App\Models\CashTransaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class CashRegisterStatusQuery
{
    /**
     * Get a comprehensive summary of the cash register for a given period.
     */
    public function getSummary(?Carbon $from = null, ?Carbon $to = null): array
    {
        $todayStart = Carbon::today()->toDateTimeString();
        $todayEnd   = Carbon::today()->endOfDay()->toDateTimeString();

        $query = CashTransaction::query();

        // 1. Build Aggregate Logic using Query Builder for better maintainability
        $stats = $query->selectRaw("
            SUM(CASE WHEN transaction_type = ? THEN amount ELSE 0 END) as total_in,
            SUM(CASE WHEN transaction_type IN (?,?,?,?) THEN amount 
                     WHEN transaction_type IN (?,?) THEN -amount 
                     ELSE 0 END) as total_out,
            SUM(CASE WHEN transaction_type = ? AND created_at >= ? AND created_at <= ? THEN amount ELSE 0 END) as today_in,
            SUM(CASE WHEN (transaction_type IN (?,?,?,?) OR transaction_type IN (?,?)) AND created_at >= ? AND created_at <= ? THEN 
                        CASE WHEN transaction_type IN (?,?) THEN -amount ELSE amount END
                     ELSE 0 END) as today_out
        ", $this->getQueryParams($todayStart, $todayEnd));

        // 2. Apply Date Filters
        if ($from) {
            $stats->where('created_at', '>=', $from);
        }
        if ($to) {
            $stats->where('created_at', '<=', $to);
        }

        $result = $stats->first();

        // 3. Determine Current/Period Balance
        if ($to) {
            $lastInPeriod = CashTransaction::where('created_at', '<=', $to)->latest('id')->first();
            $currentBalance = $lastInPeriod ? (float) $lastInPeriod->balance_after : 0.0;
        } else {
            $currentBalance = (float) CashTransaction::getCurrentBalance();
        }

        return [
            'current_balance' => $currentBalance,
            'total_in'        => (float) ($result->total_in ?? 0),
            'total_out'       => (float) ($result->total_out ?? 0),
            'today_in'        => (float) ($result->today_in ?? 0),
            'today_out'       => (float) ($result->today_out ?? 0),
        ];
    }

    /**
     * Helper to centralize all transactional constants used in the query.
     */
    private function getQueryParams(string $todayStart, string $todayEnd): array
    {
        return [
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
        ];
    }
}
