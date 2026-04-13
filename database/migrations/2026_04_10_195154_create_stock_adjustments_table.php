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
            $table->foreignId('medicine_id')->constrained('medicines');
            $table->foreignId('stock_batch_id')->constrained('stock_batches');
            $table->foreignId('user_id')->nullable()->constrained('users');
            $table->enum('type', ['Return', 'Damage', 'Correction']);
            $table->string('reason')->nullable();
            $table->integer('qty_tablets_changed');
            $table->date('adjustment_date');
            $table->timestamps();
            
            $table->index('medicine_id');
            $table->index('adjustment_date');
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
