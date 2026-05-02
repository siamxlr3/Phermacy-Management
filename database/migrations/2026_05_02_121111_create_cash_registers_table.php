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
        Schema::create('cash_registers', function (Blueprint $table) {
            $table->id();
            $table->date('shift_date');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->decimal('opening_balance', 15, 2)->default(0);
            $table->decimal('expected_cash', 15, 2)->default(0);
            $table->decimal('counted_cash', 15, 2)->nullable();
            $table->decimal('difference', 15, 2)->nullable();
            $table->enum('status', ['open', 'closed'])->default('open');
            $table->timestamp('opened_at')->useCurrent();
            $table->timestamp('closed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cash_registers');
    }
};
