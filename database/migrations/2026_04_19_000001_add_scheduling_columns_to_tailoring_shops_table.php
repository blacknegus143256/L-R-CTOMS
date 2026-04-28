<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tailoring_shops', function (Blueprint $table) {
            $table->integer('slot_duration_minutes')->default(30)->after('is_active');
            $table->integer('max_bookings_per_slot')->default(3)->after('slot_duration_minutes');
        });
    }

    public function down(): void
    {
        Schema::table('tailoring_shops', function (Blueprint $table) {
            $table->dropColumn(['slot_duration_minutes', 'max_bookings_per_slot']);
        });
    }
};