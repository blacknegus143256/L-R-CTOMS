<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE orders ALTER COLUMN measurement_type TYPE TEXT USING measurement_type::text');
        } else {
            DB::statement("ALTER TABLE orders MODIFY measurement_type ENUM('profile', 'scheduled', 'none', 'self_measured', 'workshop_fitting', 'inperson') NOT NULL DEFAULT 'profile'");
        }

        DB::statement("UPDATE orders SET measurement_type = 'none' WHERE measurement_type IS NULL OR TRIM(measurement_type) = '' OR LOWER(measurement_type) = 'none'");
        DB::statement("UPDATE orders SET measurement_type = 'scheduled' WHERE LOWER(measurement_type) IN ('workshop_fitting', 'inperson')");
        DB::statement("UPDATE orders SET measurement_type = 'profile' WHERE LOWER(measurement_type) = 'self_measured'");

        if (DB::getDriverName() !== 'pgsql') {
            DB::statement("ALTER TABLE orders MODIFY measurement_type ENUM('profile', 'scheduled', 'none') NOT NULL DEFAULT 'none'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE orders ALTER COLUMN measurement_type TYPE TEXT USING measurement_type::text');
        } else {
            DB::statement("ALTER TABLE orders MODIFY measurement_type ENUM('profile', 'scheduled', 'none', 'self_measured', 'workshop_fitting', 'inperson') NOT NULL DEFAULT 'profile'");
        }

        DB::statement("UPDATE orders SET measurement_type = 'profile' WHERE measurement_type = 'none'");

        if (DB::getDriverName() !== 'pgsql') {
            DB::statement("ALTER TABLE orders MODIFY measurement_type ENUM('profile', 'scheduled') NOT NULL DEFAULT 'profile'");
        }
    }
};
