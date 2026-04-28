<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE orders MODIFY measurement_type ENUM('profile', 'scheduled', 'none') NOT NULL DEFAULT 'none'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE orders MODIFY measurement_type ENUM('profile', 'scheduled', 'None') NOT NULL DEFAULT 'None'");
    }
};
