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
            $table->string('name');
            $table->string('generic_name')->nullable();
            
            $table->string('category_name')->nullable();
            $table->string('manufacturer_name')->nullable();
            
            $table->string('dosage_form'); // Tablet, Capsule, Syrup, etc.
            $table->string('strength')->nullable(); // e.g. 500mg, 250mg/5ml
            
            // Group A (Tablets, Capsules, etc.)
            $table->integer('tablet_per_stripe')->nullable();
            $table->integer('tablet_per_box')->nullable();
            $table->decimal('price_per_tablet', 10, 2)->nullable();
            $table->decimal('price_per_stripe', 10, 2)->nullable();
            $table->decimal('price_per_box', 10, 2)->nullable();
            
            // Group B (Syrups, Injections, etc.)
            $table->string('volume')->nullable(); // e.g. 100ml, 120ml
            $table->decimal('price', 10, 2)->nullable(); // Generic price for liquid/cream forms
            
            $table->integer('reorder_level')->default(10);
            $table->integer('stock')->default(0);
            
            $table->enum('status', ['Active', 'Inactive'])->default('Active');
            $table->timestamps();

            $table->index('name');
            $table->index('generic_name');
            $table->index('dosage_form');
            $table->index('category_name');
            $table->index('manufacturer_name');
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
