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
        Schema::create('medicines', function (Blueprint $table) {
            $table->id();
            $table->string('medicine_name');
            $table->string('generic_name')->nullable();
            
            $table->string('category');
            $table->string('manufacturer');
            
            $table->enum('dosage_form', [
                'Tablet', 'Capsule', 'Syrup', 'Drops', 'Cream', 'Ointment', 
                'Gel', 'Lotion', 'Suspension', 'Injection', 'Inhaler', 
                'Powder', 'Suppository', 'Patch', 'Sachet'
            ]);
            $table->string('strength')->nullable();
            
            $table->string('unit_type'); // e.g. Box, Strip, Piece
            $table->string('sale_unit_label'); // e.g. per Piece, per Strip
            
            $table->integer('tablets_per_strip')->nullable();
            $table->integer('strips_per_box')->nullable();
            $table->string('package_size')->nullable(); // e.g. 10x10, 100ml
            
            $table->decimal('price_per_unit', 10, 2);
            $table->decimal('price_per_stripe', 10, 2)->nullable();
            $table->decimal('price_per_box', 10, 2)->nullable();
            $table->decimal('mrp', 10, 2);
            
            $table->decimal('cost_price', 10, 4)->nullable();
            $table->integer('reorder_level')->default(10);
            $table->integer('stock')->default(0);
            
            $table->boolean('is_active')->default(true);
            $table->softDeletes();
            $table->timestamps();

            $table->index('medicine_name');
            $table->index('generic_name');
            $table->index('dosage_form');
            $table->index('category');
            $table->index('manufacturer');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medicines');
    }
};
