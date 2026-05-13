<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            if (! Schema::hasColumn('payments', 'payment_status_id')) {
                $table->foreignId('payment_status_id')->nullable()->after('payment_status')->constrained('payment_statuses');
            }
        });

        if (Schema::hasColumn('payments', 'payment_status')) {
            $distinctStatuses = DB::table('payments')
                ->whereNotNull('payment_status')
                ->distinct()
                ->pluck('payment_status')
                ->filter()
                ->values();

            foreach ($distinctStatuses as $statusName) {
                DB::table('payment_statuses')->updateOrInsert(
                    ['name' => $statusName],
                    ['description' => null, 'updated_at' => now(), 'created_at' => now()]
                );
            }

            if (DB::getDriverName() === 'pgsql') {
                DB::statement('UPDATE payments p SET payment_status_id = ps.id FROM payment_statuses ps WHERE ps.name = p.payment_status AND p.payment_status IS NOT NULL');
            } else {
                DB::statement('UPDATE payments p JOIN payment_statuses ps ON ps.name = p.payment_status SET p.payment_status_id = ps.id WHERE p.payment_status IS NOT NULL');
            }

            $pendingId = DB::table('payment_statuses')->where('name', 'Pending')->value('id');
            if (! $pendingId) {
                $pendingId = DB::table('payment_statuses')->insertGetId([
                    'name' => 'Pending',
                    'description' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            DB::table('payments')->whereNull('payment_status_id')->update(['payment_status_id' => $pendingId]);

            Schema::table('payments', function (Blueprint $table) {
                $table->dropColumn('payment_status');
            });
        }
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            if (! Schema::hasColumn('payments', 'payment_status')) {
                $table->string('payment_status')->default('Pending')->after('payment_type');
            }
        });

        if (Schema::hasColumn('payments', 'payment_status_id')) {
            if (DB::getDriverName() === 'pgsql') {
                DB::statement("UPDATE payments p SET payment_status = COALESCE(ps.name, p.payment_status, 'Pending') FROM payment_statuses ps WHERE ps.id = p.payment_status_id");
            } else {
                DB::statement('UPDATE payments p LEFT JOIN payment_statuses ps ON ps.id = p.payment_status_id SET p.payment_status = COALESCE(ps.name, p.payment_status, "Pending")');
            }

            Schema::table('payments', function (Blueprint $table) {
                $table->dropConstrainedForeignId('payment_status_id');
            });
        }
    }
};