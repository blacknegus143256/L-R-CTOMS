<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (! Schema::hasColumn('orders', 'payment_status')) {
                $table->enum('payment_status', ['Pending', 'Partial', 'Paid'])->default('Pending')->after('status');
            }

            if (! Schema::hasColumn('orders', 'materials_received')) {
                $table->boolean('materials_received')->default(false)->after('payment_status');
            }

            if (! Schema::hasColumn('orders', 'measurements_taken')) {
                $table->boolean('measurements_taken')->default(false)->after('materials_received');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'measurements_taken')) {
                $table->dropColumn('measurements_taken');
            }

            if (Schema::hasColumn('orders', 'materials_received')) {
                $table->dropColumn('materials_received');
            }

            if (Schema::hasColumn('orders', 'payment_status')) {
                $table->dropColumn('payment_status');
            }
        });
    }
};
