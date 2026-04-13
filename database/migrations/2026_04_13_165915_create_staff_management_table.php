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
        Schema::create('staff_management', function (Blueprint $table) {
            $table->id();
            $table->string('employee_id')->unique();
            $table->string('full_name');
            $table->string('phone');
            $table->string('email')->unique();
            $table->text('address')->nullable();
            $table->string('designation');
            $table->date('join_date');
            $table->decimal('basic_salary', 10, 2);
            $table->string('nid_number')->unique();
            $table->enum('status', ['active', 'resigned', 'terminated'])->default('active');
            
            $table->foreignId('shift_id')->constrained('shifts')->onDelete('cascade');
            $table->foreignId('role_id')->constrained('roles')->onDelete('cascade');
            
            $table->timestamps();
            
            // Indexes for searchable fields
            $table->index('full_name');
            $table->index('phone');
            $table->index('email');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_management');
    }
};
