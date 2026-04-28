<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Payment tracking columns
            if (! Schema::hasColumn('orders', 'payment_type')) {
                $table->enum('payment_type', ['full', 'partial'])->nullable()->after('payment_status');
            }

            if (! Schema::hasColumn('orders', 'total_amount')) {
                $table->decimal('total_amount', 12, 2)->nullable()->after('payment_type');
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

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'paymongo_payment_id')) {
                $table->dropColumn('paymongo_payment_id');
            }

            if (Schema::hasColumn('orders', 'paymongo_link_id')) {
                $table->dropColumn('paymongo_link_id');
            }

            if (Schema::hasColumn('orders', 'amount_paid')) {
                $table->dropColumn('amount_paid');
            }

            if (Schema::hasColumn('orders', 'total_amount')) {
                $table->dropColumn('total_amount');
            }

            if (Schema::hasColumn('orders', 'payment_type')) {
                $table->dropColumn('payment_type');
            }
        });
    }
};
