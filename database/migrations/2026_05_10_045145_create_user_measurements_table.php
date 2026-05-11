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
        Schema::create('user_measurements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('measurement_name'); // e.g., "Chest", "Waist", "Inseam"
            $table->decimal('value', 8, 2)->nullable();
            $table->string('unit')->default('in'); // 'in' for inches, 'cm' for centimeters
            $table->text('notes')->nullable(); // Additional notes about measurement
            $table->timestamp('last_verified_at')->nullable(); // Track when measurement was last verified
            $table->timestamps();
            
            // Ensure one active value per measurement type per user
            $table->unique(['user_id', 'measurement_name']);
            
            // Index for quick lookups
            $table->index(['user_id', 'updated_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_measurements');
    }
};
