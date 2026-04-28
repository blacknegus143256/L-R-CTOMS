<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tailoring_shops', function (Blueprint $table) {
            $table->unsignedInteger('max_user_bookings_per_slot')->default(3)->after('max_bookings_per_slot');
        });
    }

    public function down(): void
    {
        Schema::table('tailoring_shops', function (Blueprint $table) {
            $table->dropColumn('max_user_bookings_per_slot');
        });
    }
};
