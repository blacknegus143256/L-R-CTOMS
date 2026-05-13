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
            DB::statement('ALTER TABLE orders ALTER COLUMN payment_type DROP NOT NULL');
        } else {
            DB::statement('ALTER TABLE orders MODIFY payment_type VARCHAR(255) NULL');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE orders ALTER COLUMN payment_type SET NOT NULL');
        } else {
            DB::statement("ALTER TABLE orders MODIFY payment_type ENUM('full', 'partial') NOT NULL");
        }
    }
};
