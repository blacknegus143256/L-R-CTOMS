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

        foreach ([
            [
                'name' => 'Self-Measured',
                'description' => 'Customer submits measurements remotely.',
            ],
            [
                'name' => 'In-Shop Fitting',
                'description' => 'Measurements are taken during an in-shop fitting schedule.',
            ],
            [
                'name' => 'Home Visit',
                'description' => 'Measurements are taken during a home visit appointment.',
            ],
            [
                'name' => 'No Measurement Required',
                'description' => 'Order can proceed without body measurements.',
            ],
        ] as $fitMethod) {
            DB::table('fit_methods')->updateOrInsert(
                ['name' => $fitMethod['name']],
                [
                    'description' => $fitMethod['description'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fit_methods');
    }
};
