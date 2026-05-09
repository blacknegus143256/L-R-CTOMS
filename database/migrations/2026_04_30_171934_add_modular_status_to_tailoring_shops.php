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
            $table->string('gov_id_status')->default('pending')->after('document_gov_id');
            $table->string('bir_2303_status')->default('pending')->after('document_bir');
            $table->string('dti_permit_status')->default('pending')->after('document_dti');

            $table->text('gov_id_rejection_reason')->nullable()->after('gov_id_status');
            $table->text('bir_2303_rejection_reason')->nullable()->after('bir_2303_status');
            $table->text('dti_permit_rejection_reason')->nullable()->after('dti_permit_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tailoring_shops', function (Blueprint $table) {
            $table->dropColumn([
                'gov_id_rejection_reason',
                'bir_2303_rejection_reason',
                'dti_permit_rejection_reason',
                'gov_id_status',
                'bir_2303_status',
                'dti_permit_status',
            ]);
        });
    }
};
