<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shop_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained('tailoring_shops')->cascadeOnDelete();
            $table->tinyInteger('day_of_week');
            $table->boolean('is_open')->default(true);
            $table->time('open_time')->nullable();
            $table->time('close_time')->nullable();
            $table->timestamps();

            $table->unique(['shop_id', 'day_of_week']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shop_schedules');
    }
};