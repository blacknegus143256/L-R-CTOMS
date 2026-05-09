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
            $columns = [
                'payment_status',
                'payment_type',
                'manual_payment_reference_id',
                'manual_payment_proof_path',
                'amount_paid',
                'paymongo_link_id',
                'paymongo_payment_id',
            ];

            $existingColumns = array_filter($columns, fn ($column) => Schema::hasColumn('orders', $column));

            if ($existingColumns) {
                $table->dropColumn($existingColumns);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (! Schema::hasColumn('orders', 'payment_status')) {
                $table->string('payment_status')->default('Pending')->after('status');
            }

            if (! Schema::hasColumn('orders', 'payment_type')) {
                $table->string('payment_type')->nullable()->after('payment_status');
            }

            if (! Schema::hasColumn('orders', 'manual_payment_reference_id')) {
                $table->string('manual_payment_reference_id')->nullable()->after('payment_type');
            }

            if (! Schema::hasColumn('orders', 'manual_payment_proof_path')) {
                $table->string('manual_payment_proof_path')->nullable()->after('manual_payment_reference_id');
            }

            if (! Schema::hasColumn('orders', 'amount_paid')) {
                $table->decimal('amount_paid', 12, 2)->default(0)->after('total_amount');
            }

            if (! Schema::hasColumn('orders', 'paymongo_link_id')) {
                $table->string('paymongo_link_id')->nullable()->after('amount_paid');
            }

            if (! Schema::hasColumn('orders', 'paymongo_payment_id')) {
                $table->string('paymongo_payment_id')->nullable()->after('paymongo_link_id');
            }
        });
    }
};