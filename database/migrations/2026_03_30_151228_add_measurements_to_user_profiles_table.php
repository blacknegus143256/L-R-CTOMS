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
        // Drop old profile measurement columns if they exist
        if (Schema::hasColumn('users_profile', 'neck')) {
            Schema::table('users_profile', function (Blueprint $table) {
                $table->dropColumn([
                    'neck', 'chest', 'waist', 'hips', 
                    'sleeve_length', 'shoulder_width', 'inseam'
                ]);
            });
        }

        // Add new JSON columns to orders table
        Schema::table('orders', function (Blueprint $table) {
            $table->string('measurement_preference')->nullable()->comment('self_measured or workshop_fitting');
            $table->json('required_measurements')->nullable()->comment('["high_bust", "chest_circumference"] - Set by workshop');
            $table->json('submitted_measurements')->nullable()->comment('{"high_bust": "38", "chest_circumference": "40"} - Set by customer');
        });
    }



    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'measurement_preference', 
                'required_measurements', 
                'submitted_measurements'
            ]);
        });

        // Restore old profile columns for rollback
        Schema::table('users_profile', function (Blueprint $table) {
            $table->decimal('neck', 5, 2)->nullable();
            $table->decimal('chest', 5, 2)->nullable();
            $table->decimal('waist', 5, 2)->nullable();
            $table->decimal('hips', 5, 2)->nullable();
            $table->decimal('sleeve_length', 5, 2)->nullable();
            $table->decimal('shoulder_width', 5, 2)->nullable();
            $table->decimal('inseam', 5, 2)->nullable();
        });
    }
};
