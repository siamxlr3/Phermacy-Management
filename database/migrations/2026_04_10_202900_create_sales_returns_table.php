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
        Schema::create('sales_returns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained('sales');
            $table->string('return_invoice_number')->unique();
            $table->dateTime('return_date');
            $table->decimal('subtotal_returned', 15, 2);
            $table->decimal('tax_returned', 15, 2)->default(0);
            $table->decimal('total_returned', 15, 2);
            $table->string('reason')->nullable();
            $table->timestamps();
            
            $table->index('sale_id');
            $table->index('return_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_returns');
    }
};
