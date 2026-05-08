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
        Schema::dropIfExists('cash_denominations');
        Schema::dropIfExists('cash_registers');
        Schema::dropIfExists('cash_transactions');

        Schema::create('cash_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('items')->nullable(); // Renamed from description
            $table->decimal('amount', 15, 2);
            $table->enum('type', ['In', 'Out'])->default('In'); // Internal type to help with logic
            $table->decimal('balance_after', 15, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cash_transactions');
    }
};
