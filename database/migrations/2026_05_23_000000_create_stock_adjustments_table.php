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
        Schema::create('stock_adjustments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('medicine_id')->constrained('medicines')->onDelete('cascade');
            $table->foreignId('stock_batch_id')->constrained('stock_batches')->onDelete('cascade');
            
            $table->string('adjustment_type'); // damage, expired, opening_balance, correction, theft, lost
            $table->string('adjustment_unit'); // piece, strip, box, etc.
            
            $table->integer('qty_in_units');
            $table->integer('qty_change_tablets');
            $table->integer('qty_before');
            $table->integer('qty_after');
            
            $table->text('note')->nullable();
            
            $table->timestamps();
            $table->softDeletes();

            $table->index('adjustment_type');
            $table->index('created_at');
            $table->index(['medicine_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_adjustments');
    }
};
