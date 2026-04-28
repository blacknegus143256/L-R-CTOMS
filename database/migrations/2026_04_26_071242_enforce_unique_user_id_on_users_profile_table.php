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
        $latestIds = DB::table('users_profile as up1')
            ->select('up1.id')
            ->whereRaw('up1.id = (
                SELECT up2.id
                FROM users_profile up2
                WHERE up2.user_id = up1.user_id
                ORDER BY up2.updated_at DESC, up2.id DESC
                LIMIT 1
            )')
            ->pluck('id');

        if ($latestIds->isNotEmpty()) {
            DB::table('users_profile')->whereNotIn('id', $latestIds)->delete();
        }

        Schema::table('users_profile', function (Blueprint $table) {
            $table->unique('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users_profile', function (Blueprint $table) {
            $table->dropUnique('users_profile_user_id_unique');
        });
    }
};
