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
        Schema::create('taxes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->decimal('rate', 8, 4)->index();
            $table->enum('status', ['Active', 'Inactive'])->default('Active')->index();
            
            // Scalable Uniqueness: Ensures name is unique ONLY for non-deleted records
            // This allows multiple deleted records with the same name, but only one active.
            $table->string('name_unique_active')->virtualAs('IF(deleted_at IS NULL, name, NULL)')->unique();

            $table->softDeletes();
            $table->timestamps();

            $table->index('name'); // Regular index for searches
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('taxes');
    }
};
