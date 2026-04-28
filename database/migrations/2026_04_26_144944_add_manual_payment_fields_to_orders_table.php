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
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'manual_payment_reference_id')) {
                $table->string('manual_payment_reference_id')->nullable()->after('payment_type');
            }

            if (!Schema::hasColumn('orders', 'manual_payment_proof_path')) {
                $table->string('manual_payment_proof_path')->nullable()->after('manual_payment_reference_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'manual_payment_proof_path')) {
                $table->dropColumn('manual_payment_proof_path');
            }

            if (Schema::hasColumn('orders', 'manual_payment_reference_id')) {
                $table->dropColumn('manual_payment_reference_id');
            }
        });
    }
};
