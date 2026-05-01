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
        Schema::create('grns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_id')->nullable()->constrained('purchase_orders');
            $table->foreignId('supplier_id')->constrained('suppliers');
            $table->date('received_date');
            $table->string('invoice_number')->nullable();
            $table->string('received_by')->nullable();
            $table->decimal('total_amount', 15, 2);
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->enum('payment_status', ['Paid', 'Due', 'Partially Paid'])->default('Due');
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index('received_date');
            $table->index('invoice_number');
            $table->index('payment_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grns');
    }
};
