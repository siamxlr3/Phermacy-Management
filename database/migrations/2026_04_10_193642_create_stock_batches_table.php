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
        Schema::create('stock_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('medicine_id')->constrained('medicines');
            $table->foreignId('supplier_id')->constrained('suppliers');
            $table->foreignId('grn_id')->nullable()->constrained('grns')->onDelete('cascade');
            $table->string('dosage_form_snapshot'); // Historical accuracy
            $table->string('batch_number');
            $table->date('expiry_date');
            
            // Quantity in smallest units (for calculations)
            $table->decimal('qty_tablets', 12, 3); 
            $table->decimal('qty_tablets_remaining', 12, 3);
            
            // Box tracking
            $table->decimal('qty_boxes', 12, 3);
            $table->decimal('qty_boxes_remaining', 12, 3);
            
            // Unit tracking
            $table->decimal('qty_units', 12, 3)->nullable();
            $table->decimal('qty_units_remaining', 12, 3)->nullable();
            
            // Financials
            $table->decimal('cost_per_unit', 15, 4)->nullable();
            $table->decimal('cost_per_stripe', 15, 4)->nullable();
            $table->decimal('cost_per_box', 15, 4)->nullable();
            $table->decimal('ingested_total_cost_value', 15, 2)->default(0);
            $table->decimal('total_cost_value', 15, 4)->default(0)->comment('Total valuation of remaining stock at cost');
            
            $table->date('received_date');
            $table->softDeletes();
            $table->timestamps();
            
            $table->index('batch_number');
            $table->index('expiry_date');
            $table->index(['medicine_id', 'qty_tablets_remaining']);
            $table->index(['qty_tablets_remaining', 'total_cost_value']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_batches');
    }
};
