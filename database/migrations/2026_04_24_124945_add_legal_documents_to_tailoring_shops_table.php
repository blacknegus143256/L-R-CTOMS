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
            if (!Schema::hasColumn('tailoring_shops', 'document_gov_id')) {
                $table->string('document_gov_id')->nullable();
            }
            if (!Schema::hasColumn('tailoring_shops', 'document_bir')) {
                $table->string('document_bir')->nullable();
            }
            if (!Schema::hasColumn('tailoring_shops', 'document_dti')) {
                $table->string('document_dti')->nullable();
            }
            if (!Schema::hasColumn('tailoring_shops', 'gov_id_status')) {
                $table->enum('gov_id_status', ['pending', 'approved', 'rejected'])->default('pending');
            }
            if (!Schema::hasColumn('tailoring_shops', 'bir_2303_status')) {
                $table->enum('bir_2303_status', ['pending', 'approved', 'rejected'])->default('pending');
            }
            if (!Schema::hasColumn('tailoring_shops', 'dti_permit_status')) {
                $table->enum('dti_permit_status', ['pending', 'approved', 'rejected'])->default('pending');
            }
            if (!Schema::hasColumn('tailoring_shops', 'terms_accepted_at')) {
                $table->timestamp('terms_accepted_at')->nullable();
            }
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
                'gov_id_status',
                'bir_2303_status',
                'dti_permit_status',
                'terms_accepted_at',
            ]);
        });
    }
};
