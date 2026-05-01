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
            $table->string('batch_number');
            $table->date('expiry_date');
            
            // Quantity in smallest units
            $table->integer('qty_tablets'); 
            $table->integer('qty_tablets_remaining');
            
            // Financials (Group A)
            $table->decimal('cost_per_tablet', 15, 2)->nullable();
            $table->decimal('cost_per_stripe', 15, 2)->nullable();
            $table->decimal('cost_per_box', 15, 2)->nullable();
            
            // Financials (Group B)
            $table->string('volume')->nullable();
            $table->decimal('price', 15, 2)->nullable(); // Unit cost price
            
            $table->date('received_date');
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
