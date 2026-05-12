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
            $table->string('dosage_form_snapshot');
            $table->string('batch_number');
            $table->date('expiry_date');
            
            $table->integer('qty_boxes_received');
            $table->integer('qty_units_received')->nullable(); // Units per box (for non-tablet)
            $table->string('package_size')->nullable(); // Snapshot of volume/size
            
            $table->decimal('cost_per_box', 15, 4)->nullable();
            $table->decimal('cost_per_stripe', 15, 4)->nullable();
            $table->decimal('cost_per_unit', 15, 4); // Standardized unit cost
            
            $table->decimal('subtotal', 15, 2);
            
            $table->timestamps();
            $table->softDeletes();
            
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
