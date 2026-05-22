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
            $table->string('description')->nullable();
            $table->decimal('amount', 15, 2);
            $table->enum('transaction_type', ['In', 'Out', 'sale_refund', 'expense', 'grn_payment'])->default('In');
            $table->decimal('balance_after', 15, 2)->default(0);
            $table->string('reference_type')->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->string('reference_number')->nullable();
            $table->enum('payment_method', ['cash', 'card', 'online', 'due'])->default('cash');
            $table->string('party_name')->nullable();
            $table->enum('party_type', ['customer', 'supplier', 'other'])->default('other');
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
