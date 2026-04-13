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
        Schema::create('alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('medicine_id')->nullable()->constrained('medicines')->onDelete('cascade');
            $table->foreignId('stock_batch_id')->nullable()->constrained('stock_batches')->onDelete('cascade');
            $table->string('type'); // Low Stock, Expiry
            $table->string('severity'); // Info, Warning, Critical
            $table->text('message');
            $table->string('status')->default('Active'); // Active, Dismissed
            $table->timestamps();

            $table->index('type');
            $table->index('status');
            $table->index('severity');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('alerts');
    }
};
