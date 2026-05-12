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
            $table->integer('qty_tablets'); 
            $table->integer('qty_tablets_remaining');
            
            // Box tracking
            $table->integer('qty_boxes');
            $table->integer('qty_boxes_remaining');
            
            // Unit tracking (for Group B)
            $table->integer('qty_units')->nullable();
            $table->integer('qty_units_remaining')->nullable();
            
            // Financials
            $table->decimal('cost_per_unit', 15, 4);
            $table->decimal('cost_per_stripe', 15, 4)->nullable();
            $table->decimal('cost_per_box', 15, 4)->nullable();
            
            $table->date('received_date');
            $table->softDeletes();
            $table->timestamps();
            
            $table->index('batch_number');
            $table->index('expiry_date');
            $table->index(['medicine_id', 'qty_tablets_remaining']);
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
