<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tailoring_shop_id')->constrained()->cascadeOnDelete();
            $table->foreignId('service_category_id')->nullable()->constrained()->nullOnDelete();

            $table->string('service_name')->nullable();
            $table->text('service_description')->nullable();
            $table->decimal('price', 10, 2)->nullable();
            $table->string('duration_days')->nullable();
            
            $table->boolean('is_available')->default(true)->default(true);
            $table->boolean('rush_service_available')->default(false);
            $table->boolean('appointment_required')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};
