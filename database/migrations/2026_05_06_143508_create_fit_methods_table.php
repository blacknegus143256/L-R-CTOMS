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
        Schema::create('fit_methods', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        $now = now();

        DB::table('fit_methods')->insert([
            [
                'name' => 'Self-Measured',
                'description' => 'Customer submits measurements remotely.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'In-Shop Fitting',
                'description' => 'Measurements are taken during an in-shop fitting schedule.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Home Visit',
                'description' => 'Measurements are taken during a home visit appointment.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'No Measurement Required',
                'description' => 'Order can proceed without body measurements.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fit_methods');
    }
};
