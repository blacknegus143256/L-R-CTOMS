<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $indexExists = DB::selectOne(
            "SELECT to_regclass('public.orders_expected_completion_date_index') AS index_name"
        );

        if (! $indexExists?->index_name) {
            Schema::table('orders', function (Blueprint $table) {
                $table->index('expected_completion_date', 'orders_expected_completion_date_index');
            });
        }
    }

    public function down(): void
    {
        $indexExists = DB::selectOne(
            "SELECT to_regclass('public.orders_expected_completion_date_index') AS index_name"
        );

        if ($indexExists?->index_name) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropIndex('orders_expected_completion_date_index');
            });
        }
    }
};
