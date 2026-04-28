<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropUnique('appointments_shop_id_date_time_start_user_id_unique');
            $table->index(['shop_id', 'date', 'time_start'], 'appointments_shop_date_time_idx');
            $table->index(['shop_id', 'user_id', 'date', 'time_start'], 'appointments_shop_user_date_time_idx');
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropIndex('appointments_shop_date_time_idx');
            $table->dropIndex('appointments_shop_user_date_time_idx');
            $table->unique(['shop_id', 'date', 'time_start', 'user_id']);
        });
    }
};
