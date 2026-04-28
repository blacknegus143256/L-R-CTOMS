<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->integer('production_min_days')->nullable();
            $table->integer('production_max_days')->nullable();
            $table->timestamp('production_started_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'production_min_days',
                'production_max_days',
                'production_started_at',
            ]);
        });
    }
};
