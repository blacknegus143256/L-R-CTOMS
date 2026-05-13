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
            DB::statement('ALTER TABLE order_measurements ALTER COLUMN measurement_value DROP NOT NULL');
        } else {
            DB::statement('ALTER TABLE order_measurements MODIFY measurement_value VARCHAR(255) NULL');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE order_measurements ALTER COLUMN measurement_value SET NOT NULL');
        } else {
            DB::statement('ALTER TABLE order_measurements MODIFY measurement_value VARCHAR(255) NOT NULL');
        }
    }
};
