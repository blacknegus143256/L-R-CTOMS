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
        // Data migration: Map existing order statuses to new enum values
        \Illuminate\Support\Facades\DB::table('orders')
            ->where('status', 'Pending')
            ->update(['status' => 'Requested']);
        \Illuminate\Support\Facades\DB::table('orders')
            ->where('status', 'Accepted')
            ->update(['status' => 'Confirmed']);
        \Illuminate\Support\Facades\DB::table('orders')
            ->where('status', 'In Progress')
            ->update(['status' => 'In Production']);

        Schema::table('services', function (Blueprint $table) {
            $table->string('checkout_type')->default('requires_quote')->after('price');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            //
        });
    }
};
