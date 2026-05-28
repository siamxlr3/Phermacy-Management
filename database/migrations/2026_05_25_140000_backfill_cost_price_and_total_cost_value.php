<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // ─── 1. Backfill sale_items.cost_price ───────────────────────────────
        // Only update rows where cost_price is NULL (legacy rows before denormalization)
        DB::statement("
            UPDATE sale_items si
            LEFT JOIN stock_batches sb ON si.stock_batch_id = sb.id
            SET si.cost_price = COALESCE(sb.cost_per_unit, 0)
            WHERE si.cost_price IS NULL
              AND si.deleted_at IS NULL
        ");

        // ─── 2. Backfill stock_batches.total_cost_value ──────────────────────
        // For Tablet/Capsule/Suppository/Patch: value = (qty_remaining / tablets_per_box) * cost_per_box
        // For all others (liquids, syrup, etc.): value = qty_remaining * cost_per_unit
        DB::statement("
            UPDATE stock_batches sb
            JOIN medicines m ON sb.medicine_id = m.id
            SET sb.total_cost_value = CASE
                WHEN m.dosage_form IN ('Tablet', 'Capsule', 'Suppository', 'Patch')
                THEN (
                    sb.qty_tablets_remaining
                    / NULLIF(
                        COALESCE(m.tablets_per_strip, 1) * COALESCE(m.strips_per_box, 1),
                        0
                    )
                ) * COALESCE(sb.cost_per_box, 0)
                ELSE sb.qty_tablets_remaining * COALESCE(sb.cost_per_unit, 0)
            END
            WHERE sb.deleted_at IS NULL
        ");
    }

    public function down(): void
    {
        // Reset both columns back to their defaults (0 / NULL)
        DB::statement("UPDATE sale_items SET cost_price = NULL WHERE cost_price IS NOT NULL");
        DB::statement("UPDATE stock_batches SET total_cost_value = 0");
    }
};
