<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('tailoring_shops')) {
            return;
        }

        DB::transaction(function () {
            $duplicateOwners = DB::table('tailoring_shops')
                ->select('user_id', DB::raw('MIN(id) as keep_id'), DB::raw('COUNT(*) as total'))
                ->groupBy('user_id')
                ->havingRaw('COUNT(*) > 1')
                ->get();

            foreach ($duplicateOwners as $duplicateOwner) {
                DB::table('tailoring_shops')
                    ->where('user_id', $duplicateOwner->user_id)
                    ->where('id', '!=', $duplicateOwner->keep_id)
                    ->delete();
            }
        });
    }

    public function down(): void
    {
        // This cleanup is destructive by design for local development.
        // It cannot safely restore deleted duplicate rows.
    }
};
