<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Backfill existing orders into order_services before dropping columns
        if (Schema::hasTable('order_services') && Schema::hasColumn('orders', 'service_id') && Schema::hasColumn('orders', 'total_price')) {
            DB::statement("INSERT INTO order_services (order_id, service_id, price, quantity, created_at, updated_at) SELECT id, service_id, total_price, 1, NOW(), NOW() FROM orders WHERE service_id IS NOT NULL;");
        }

        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'service_id')) {
                // Drop foreign key safely if exists
                try {
                    $table->dropForeign('orders_service_id_foreign');
                } catch (\Throwable $e) {
                    // ignore if constraint does not exist
                }

                $table->dropColumn('service_id');
            }

            if (Schema::hasColumn('orders', 'total_price')) {
                $table->dropColumn('total_price');
            }

            if (Schema::hasColumn('orders', 'rush_order')) {
                $table->dropColumn('rush_order');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'service_id')) {
                $table->foreignId('service_id')->nullable()->constrained('services')->onDelete('cascade');
            }

            if (!Schema::hasColumn('orders', 'total_price')) {
                $table->decimal('total_price', 10, 2)->default(0);
            }

            if (!Schema::hasColumn('orders', 'rush_order')) {
                $table->boolean('rush_order')->default(false);
            }
        });
    }
};
