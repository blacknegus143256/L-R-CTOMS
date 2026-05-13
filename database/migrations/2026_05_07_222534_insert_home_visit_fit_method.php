<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('fit_methods')->updateOrInsert(
            ['name' => 'Home Visit'],
            [
                'description' => 'A professional tailor visits the customer location for measurements and material pickup.',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('fit_methods')->where('name', 'Home Visit')->delete();
    }
};
