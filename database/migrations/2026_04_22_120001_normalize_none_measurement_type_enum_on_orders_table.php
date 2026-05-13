<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("UPDATE orders SET measurement_type = 'none' WHERE measurement_type IS NULL OR TRIM(measurement_type) = '' OR LOWER(measurement_type) = 'none'");

        if (DB::getDriverName() !== 'pgsql') {
            DB::statement("ALTER TABLE orders MODIFY measurement_type ENUM('profile', 'scheduled', 'none') NOT NULL DEFAULT 'none'");
        }
    }

    public function down(): void
    {
        DB::statement("UPDATE orders SET measurement_type = 'profile' WHERE LOWER(measurement_type) = 'none'");

        if (DB::getDriverName() !== 'pgsql') {
            DB::statement("ALTER TABLE orders MODIFY measurement_type ENUM('profile', 'scheduled', 'None') NOT NULL DEFAULT 'None'");
        }
    }
};
