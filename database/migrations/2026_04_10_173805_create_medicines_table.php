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
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->foreignId('manufacturer_id')->nullable()->constrained('manufacturers')->nullOnDelete();
            
            $table->integer('tablets_per_strip')->nullable();
            $table->integer('strips_per_box')->nullable();
            $table->string('sale_unit')->default('Tablet'); // e.g. Tablet, Bottle, Strip, Box
            
            $table->decimal('price_per_tablet', 10, 2);
            $table->decimal('cost_price', 10, 2);
            $table->integer('reorder_level')->default(10);
            $table->integer('stock')->default(0);
            
            $table->enum('status', ['Active', 'Inactive'])->default('Active');
            $table->timestamps();

            $table->index('name');
            $table->index('generic_name');
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
