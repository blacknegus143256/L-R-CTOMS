<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (! Schema::hasColumn('orders', 'order_status_id')) {
                $table->foreignId('order_status_id')->nullable()->after('status')->constrained('order_statuses');
            }
        });

        if (Schema::hasColumn('orders', 'status')) {
            $distinctStatuses = DB::table('orders')
                ->whereNotNull('status')
                ->distinct()
                ->pluck('status')
                ->filter()
                ->values();

            foreach ($distinctStatuses as $statusName) {
                DB::table('order_statuses')->updateOrInsert(
                    ['name' => $statusName],
                    ['description' => null, 'updated_at' => now(), 'created_at' => now()]
                );
            }

            if (DB::getDriverName() === 'pgsql') {
                DB::statement('UPDATE orders o SET order_status_id = os.id FROM order_statuses os WHERE os.name = o.status AND o.status IS NOT NULL');
            } else {
                DB::statement('UPDATE orders o JOIN order_statuses os ON os.name = o.status SET o.order_status_id = os.id WHERE o.status IS NOT NULL');
            }

            $requestedId = DB::table('order_statuses')->where('name', 'Requested')->value('id');
            if (! $requestedId) {
                $requestedId = DB::table('order_statuses')->insertGetId([
                    'name' => 'Requested',
                    'description' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            DB::table('orders')->whereNull('order_status_id')->update(['order_status_id' => $requestedId]);

            Schema::table('orders', function (Blueprint $table) {
                $table->dropColumn('status');
            });
        }
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (! Schema::hasColumn('orders', 'status')) {
                $table->string('status')->default('Requested')->after('service_id');
            }
        });

        if (Schema::hasColumn('orders', 'order_status_id')) {
            if (DB::getDriverName() === 'pgsql') {
                DB::statement("UPDATE orders o SET status = COALESCE(os.name, o.status, 'Requested') FROM order_statuses os WHERE os.id = o.order_status_id");
            } else {
                DB::statement('UPDATE orders o LEFT JOIN order_statuses os ON os.id = o.order_status_id SET o.status = COALESCE(os.name, o.status, "Requested")');
            }

            Schema::table('orders', function (Blueprint $table) {
                $table->dropConstrainedForeignId('order_status_id');
            });
        }
    }
};