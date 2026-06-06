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
        Schema::create('sales_summaries', function (Blueprint $table) {
            $table->id();
            $table->date('date')->unique();
            $table->decimal('total_gross', 15, 2)->default(0);
            $table->decimal('total_revenue', 15, 2)->default(0)->comment('Grand total minus refunds');
            $table->decimal('total_completed', 15, 2)->default(0);
            $table->decimal('total_tax', 15, 2)->default(0);
            $table->decimal('total_discount', 15, 2)->default(0);
            $table->decimal('total_cogs', 15, 2)->default(0);
            $table->decimal('total_returned', 15, 2)->default(0);
            $table->decimal('total_due', 15, 2)->default(0);
            $table->integer('transaction_count')->default(0);
            $table->integer('returns_count')->default(0);
            $table->integer('due_customers_count')->default(0);
            $table->timestamps();
            
            $table->index('date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_summaries');
    }
};
