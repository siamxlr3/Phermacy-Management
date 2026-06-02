<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class RecalculateStockBatchValuation extends Command
{
    protected $signature   = 'stockbatch:recalculate {--dry-run : Preview changes without writing to the database}';
    protected $description = 'Sync qty_boxes_remaining from tablet ratio and recalculate total_cost_value for all stock_batches.';

    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');

        $this->info($isDryRun ? '[DRY-RUN MODE — no changes will be written]' : 'Recalculating stock batch valuations…');

        // --- Before totals ---
        $beforeTotal = (float) DB::table('stock_batches')
            ->whereNull('deleted_at')
            ->sum('total_cost_value');

        $this->line(sprintf('  Before total_cost_value SUM: %s', number_format($beforeTotal, 2)));

        // Load all non-deleted batches that have box data
        $rows = DB::table('stock_batches')
            ->whereNull('deleted_at')
            ->where('qty_boxes', '>', 0)
            ->where('qty_tablets', '>', 0)
            ->whereNotNull('qty_boxes_remaining')
            ->whereNotNull('qty_tablets_remaining')
            ->select([
                'id',
                'qty_tablets',
                'qty_boxes',
                'qty_tablets_remaining',
                'qty_boxes_remaining',
                'cost_per_box',
                'cost_per_unit',
                'total_cost_value',
            ])
            ->get();

        $fixedBoxQty   = 0;
        $fixedCost     = 0;
        $fixedUnit     = 0;
        $totalDelta    = 0.0;

        foreach ($rows as $row) {
            // Step 1: Derive correct qty_boxes_remaining from tablet ratio.
            //         Past sales only decremented qty_tablets_remaining, so
            //         qty_boxes_remaining may still be at the original full value.
            $tabletsPerBox      = (float) $row->qty_tablets / (float) $row->qty_boxes;
            $correctBoxesRemaining = ($tabletsPerBox > 0)
                ? round((float) $row->qty_tablets_remaining / $tabletsPerBox, 4)
                : (float) $row->qty_boxes_remaining;

            $boxQtyDrift = abs($correctBoxesRemaining - (float) $row->qty_boxes_remaining);

            // Step 2: Derive correct total_cost_value
            $totalCost = 0.0;
            if ($row->cost_per_box > 0) {
                $totalCost = round($correctBoxesRemaining * (float) $row->cost_per_box, 2);
            } elseif ($row->cost_per_unit > 0) {
                $totalCost = round((float) $row->qty_tablets_remaining * (float) $row->cost_per_unit, 2);
            }

            $costDelta = $totalCost - (float) $row->total_cost_value;

            $needsBoxFix  = $boxQtyDrift >= 0.0001;
            $needsCostFix = abs($costDelta) >= 0.01;

            if ($needsBoxFix || $needsCostFix) {
                if ($needsBoxFix) $fixedBoxQty++;
                if ($needsCostFix) {
                    $fixedCost++;
                    $totalDelta += $costDelta;
                }

                if (!$isDryRun) {
                    $update = ['updated_at' => now()];
                    if ($needsBoxFix)  $update['qty_boxes_remaining'] = $correctBoxesRemaining;
                    if ($needsCostFix) $update['total_cost_value']    = $totalCost;

                    DB::table('stock_batches')->where('id', $row->id)->update($update);
                }
            }
        }

        // --- Fix unit-only rows (no cost_per_box) ---
        $unitRows = DB::table('stock_batches')
            ->whereNull('deleted_at')
            ->where(function ($q) {
                $q->whereNull('cost_per_box')->orWhere('cost_per_box', '<=', 0);
            })
            ->where('cost_per_unit', '>', 0)
            ->select(['id', 'qty_tablets_remaining', 'cost_per_unit', 'total_cost_value'])
            ->get();

        foreach ($unitRows as $row) {
            $correct = round((float) $row->qty_tablets_remaining * (float) $row->cost_per_unit, 2);
            $delta   = $correct - (float) $row->total_cost_value;

            if (abs($delta) >= 0.01) {
                $fixedUnit++;
                $totalDelta += $delta;

                if (!$isDryRun) {
                    DB::table('stock_batches')
                        ->where('id', $row->id)
                        ->update(['total_cost_value' => $correct, 'updated_at' => now()]);
                }
            }
        }

        // --- After total ---
        $afterTotal = $isDryRun
            ? $beforeTotal + $totalDelta
            : (float) DB::table('stock_batches')->whereNull('deleted_at')->sum('total_cost_value');

        $this->line(sprintf('  After  total_cost_value SUM: %s', number_format($afterTotal, 2)));
        $this->newLine();
        $this->info(sprintf('  Rows with corrected qty_boxes_remaining: %d', $fixedBoxQty));
        $this->info(sprintf('  Rows with corrected total_cost_value:    %d', $fixedCost + $fixedUnit));
        $this->info(sprintf('  Net cost adjustment:                     %+.2f', $totalDelta));

        if ($isDryRun) {
            $this->warn('  [DRY-RUN] No rows were updated. Remove --dry-run to apply.');
        } else {
            $this->newLine();
            $this->info('  ✓ Reconciliation complete. Run php artisan cache:clear to refresh cached reports.');
        }

        return self::SUCCESS;
    }
}
