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
        Schema::table('tailoring_shops', function (Blueprint $table) {
            $table->text('resubmission_reason')->nullable()->comment('Reason for requesting document resubmission');
            $table->boolean('requires_resubmission')->default(false)->comment('Flag indicating shop needs to resubmit documents');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tailoring_shops', function (Blueprint $table) {
            $table->dropColumn(['resubmission_reason', 'requires_resubmission']);
        });
    }
};
