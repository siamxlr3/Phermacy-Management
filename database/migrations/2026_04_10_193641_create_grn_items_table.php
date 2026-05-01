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
        Schema::create('grn_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('grn_id')->constrained('grns')->onDelete('cascade');
            $table->foreignId('medicine_id')->constrained('medicines');
            $table->string('batch_number');
            $table->date('expiry_date');
            
            // Common
            $table->integer('qty_boxes_received'); // This can represent units for Group B
            $table->decimal('subtotal', 15, 2);
            
            // Group A (Solid/Patch)
            $table->decimal('cost_per_box', 15, 2)->nullable();
            $table->decimal('cost_per_stripe', 15, 2)->nullable();
            $table->decimal('cost_per_tablet', 15, 2)->nullable();
            $table->string('strength')->nullable();
            
            // Group B (Liquid/Cream/Other)
            $table->string('volume')->nullable();
            $table->decimal('price', 15, 2)->nullable(); // Cost price for liquid units
            
            $table->timestamps();
            
            $table->index('batch_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grn_items');
    }
};
