<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            // First add new columns (before renaming)
            $table->string('service_category')->nullable()->after('tailoring_shop_id');
            $table->text('service_description')->nullable()->after('service_category');
            $table->decimal('starting_price', 10, 2)->nullable()->after('service_description');
            $table->string('turnaround_time')->nullable()->after('starting_price');
            $table->boolean('is_available')->default(true)->after('turnaround_time');
            $table->boolean('rush_service_available')->default(false)->after('is_available');
            $table->boolean('appointment_required')->default(false)->after('rush_service_available');
            $table->text('notes')->nullable()->after('appointment_required');
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn([
                'service_category',
                'service_description',
                'starting_price',
                'turnaround_time',
                'is_available',
                'rush_service_available',
                'appointment_required',
                'notes',
            ]);
        });
    }
};
