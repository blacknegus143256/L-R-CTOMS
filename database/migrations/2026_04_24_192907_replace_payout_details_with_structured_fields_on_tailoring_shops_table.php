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
        Schema::table('tailoring_shops', function (Blueprint $table) {
            $table->string('payout_method')->nullable()->after('shop_name');
            $table->string('payout_account')->nullable()->after('payout_method');
            $table->string('document_qr_code')->nullable()->after('document_dti');
        });

        DB::table('tailoring_shops')
            ->whereNull('payout_account')
            ->update(['payout_account' => DB::raw('payout_details')]);

        Schema::table('tailoring_shops', function (Blueprint $table) {
            $table->dropColumn('payout_details');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tailoring_shops', function (Blueprint $table) {
            $table->string('payout_details')->nullable()->after('shop_name');
        });

        DB::table('tailoring_shops')
            ->whereNull('payout_details')
            ->update(['payout_details' => DB::raw('payout_account')]);

        Schema::table('tailoring_shops', function (Blueprint $table) {
            $table->dropColumn(['payout_method', 'payout_account', 'document_qr_code']);
        });
    }
};
