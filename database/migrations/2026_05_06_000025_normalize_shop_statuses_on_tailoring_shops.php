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
        // Step 1: Seed shop_statuses data FIRST (idempotent via updateOrInsert)
        // This ensures IDs exist before we reference them
        $now = now();
        $statuses = [
            ['name' => 'Pending', 'description' => 'Shop is under review'],
            ['name' => 'Approved', 'description' => 'Shop is approved and active'],
            ['name' => 'Rejected', 'description' => 'Shop application was rejected'],
            ['name' => 'Suspended', 'description' => 'Shop is temporarily suspended'],
        ];

        foreach ($statuses as $status) {
            DB::table('shop_statuses')->updateOrInsert(
                ['name' => $status['name']],
                ['description' => $status['description'], 'updated_at' => $now]
            );
        }

        // Step 2: Add shop_status_id column as nullable ONLY if it doesn't exist
        // (Handles case where migration failed halfway on previous run)
        if (!Schema::hasColumn('tailoring_shops', 'shop_status_id')) {
            Schema::table('tailoring_shops', function (Blueprint $table) {
                $table->foreignId('shop_status_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('shop_statuses')
                    ->cascadeOnDelete();
            });
        }

        // Step 3: Backfill shop_status_id based on existing status string values
        // CRUCIAL: Always provide a fallback so NO values are NULL
        $pendingId = DB::table('shop_statuses')->where('name', 'Pending')->value('id');
        $shops = DB::table('tailoring_shops')->get();

        foreach ($shops as $shop) {
            // Try to map the existing status string to a shop_status ID
            $statusId = DB::table('shop_statuses')
                ->where('name', ucfirst($shop->status ?? 'Pending'))
                ->value('id');

            // Fallback to 'Pending' if no match found or status was null
            $statusId = $statusId ?? $pendingId;

            DB::table('tailoring_shops')
                ->where('id', $shop->id)
                ->update(['shop_status_id' => $statusId]);
        }

        // Step 4: Make shop_status_id NOT NULL after backfill is complete
        Schema::table('tailoring_shops', function (Blueprint $table) {
            $table->foreignId('shop_status_id')->nullable(false)->change();
        });

        // Step 5: Drop old columns (only if they exist to handle partial failures)
        if (Schema::hasColumn('tailoring_shops', 'status')) {
            Schema::table('tailoring_shops', function (Blueprint $table) {
                $table->dropColumn('status');
            });
        }

        if (Schema::hasColumn('tailoring_shops', 'rejection_reason')) {
            Schema::table('tailoring_shops', function (Blueprint $table) {
                $table->dropColumn('rejection_reason');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Step 1: Restore the old columns if they don't exist
        if (!Schema::hasColumn('tailoring_shops', 'status')) {
            Schema::table('tailoring_shops', function (Blueprint $table) {
                $table->string('status')->default('Pending')->after('id');
            });
        }

        if (!Schema::hasColumn('tailoring_shops', 'rejection_reason')) {
            Schema::table('tailoring_shops', function (Blueprint $table) {
                $table->text('rejection_reason')->nullable()->after('status');
            });
        }

        // Step 2: Backfill status from shop_statuses if shop_status_id still exists
        if (Schema::hasColumn('tailoring_shops', 'shop_status_id')) {
            $shops = DB::table('tailoring_shops')->get();

            foreach ($shops as $shop) {
                $statusName = DB::table('shop_statuses')
                    ->where('id', $shop->shop_status_id)
                    ->value('name');

                DB::table('tailoring_shops')
                    ->where('id', $shop->id)
                    ->update(['status' => $statusName ?? 'Pending']);
            }

            // Step 3: Drop the foreign key and column
            Schema::table('tailoring_shops', function (Blueprint $table) {
                $table->dropForeignIdFor('ShopStatus');
                $table->dropColumn('shop_status_id');
            });
        }
    }
};
