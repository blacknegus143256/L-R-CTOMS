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
        Schema::table('orders', function (Blueprint $table) {
            $table->string('style_tag')->nullable()->after('service_id');
            $table->enum('material_source', ['customer', 'shop', 'tailor_choice'])->default('tailor_choice')->after('style_tag');
            $table->string('design_image')->nullable()->after('material_source');
            $table->enum('measurement_type', ['profile', 'scheduled'])->default('profile')->after('design_image');
            $table->dateTime('measurement_date')->nullable()->after('measurement_type');
            $table->json('measurement_snapshot')->nullable()->after('measurement_date');
        });
    }

    /**
     * Reverse the migrations.
     */
public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['style_tag', 'material_source', 'design_image', 'measurement_type', 'measurement_date', 'measurement_snapshot']);
        });
    }
};
