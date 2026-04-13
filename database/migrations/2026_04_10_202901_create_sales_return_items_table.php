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
        Schema::create('sales_return_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_return_id')->constrained('sales_returns')->onDelete('cascade');
            $table->foreignId('sale_item_id')->constrained('sale_items');
            $table->foreignId('medicine_id')->constrained('medicines');
            $table->foreignId('stock_batch_id')->constrained('stock_batches');
            $table->integer('qty_returned');
            $table->decimal('unit_price', 15, 2);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('subtotal', 15, 2);
            $table->timestamps();
            
            $table->index('sales_return_id', 'sr_id_idx');
            $table->index('sale_item_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_return_items');
    }
};
