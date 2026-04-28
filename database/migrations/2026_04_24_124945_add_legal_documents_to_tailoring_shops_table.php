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
            $table->string('document_gov_id')->nullable();
            $table->string('document_bir')->nullable();
            $table->string('document_dti')->nullable();
            $table->timestamp('terms_accepted_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tailoring_shops', function (Blueprint $table) {
            $table->dropColumn([
                'document_gov_id',
                'document_bir',
                'document_dti',
                'terms_accepted_at',
            ]);
        });
    }
};
