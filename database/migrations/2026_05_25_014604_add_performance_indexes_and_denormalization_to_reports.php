<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add indexes for performance
        Schema::table('sales', function (Blueprint $table) {
            $table->index('status');
        });

        Schema::table('medicines', function (Blueprint $table) {
            $table->index('is_active');
        });

        // 2. Denormalize cost_price in sale_items for fast COGS calculation
        Schema::table('sale_items', function (Blueprint $table) {
            $table->decimal('cost_price', 15, 4)->after('qty_tablets')->nullable()->comment('Cost price per tablet at time of sale');
            $table->index('stock_batch_id');
        });

        // 3. Denormalize total_cost_value in stock_batches for fast valuation
        Schema::table('stock_batches', function (Blueprint $table) {
            $table->decimal('total_cost_value', 15, 2)->after('qty_units_remaining')->default(0)->comment('Total valuation of remaining stock at cost');
            $table->index(['qty_tablets_remaining', 'total_cost_value']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_batches', function (Blueprint $table) {
            $table->dropColumn('total_cost_value');
        });

        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropColumn('cost_price');
            $table->dropIndex(['stock_batch_id']);
        });

        if (Schema::hasTable('medicines')) {
            Schema::table('medicines', function (Blueprint $table) {
                $table->dropIndex(['is_active']);
            });
        }

        if (Schema::hasTable('sales')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->dropIndex(['status']);
            });
        }
    }
};
