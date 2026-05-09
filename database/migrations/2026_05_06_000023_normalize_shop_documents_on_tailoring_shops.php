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
        $shops = DB::table('tailoring_shops')->get();
        $now = now();

        foreach ($shops as $shop) {
            if (! empty($shop->document_gov_id)) {
                DB::table('shop_documents')->insert([
                    'shop_id' => $shop->id,
                    'document_type' => 'gov_id',
                    'file_path' => $shop->document_gov_id,
                    'status' => $shop->gov_id_status ?: 'pending',
                    'rejection_reason' => $shop->gov_id_rejection_reason,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            if (! empty($shop->document_bir)) {
                DB::table('shop_documents')->insert([
                    'shop_id' => $shop->id,
                    'document_type' => 'bir_2303',
                    'file_path' => $shop->document_bir,
                    'status' => $shop->bir_2303_status ?: 'pending',
                    'rejection_reason' => $shop->bir_2303_rejection_reason,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            if (! empty($shop->document_dti)) {
                DB::table('shop_documents')->insert([
                    'shop_id' => $shop->id,
                    'document_type' => 'dti_permit',
                    'file_path' => $shop->document_dti,
                    'status' => $shop->dti_permit_status ?: 'pending',
                    'rejection_reason' => $shop->dti_permit_rejection_reason,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        Schema::table('tailoring_shops', function (Blueprint $table) {
            $table->dropColumn([
                'document_gov_id',
                'gov_id_status',
                'gov_id_rejection_reason',
                'document_bir',
                'bir_2303_status',
                'bir_2303_rejection_reason',
                'document_dti',
                'dti_permit_status',
                'dti_permit_rejection_reason',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tailoring_shops', function (Blueprint $table) {
            $table->string('document_gov_id')->nullable();
            $table->string('gov_id_status')->default('pending');
            $table->text('gov_id_rejection_reason')->nullable();
            $table->string('document_bir')->nullable();
            $table->string('bir_2303_status')->default('pending');
            $table->text('bir_2303_rejection_reason')->nullable();
            $table->string('document_dti')->nullable();
            $table->string('dti_permit_status')->default('pending');
            $table->text('dti_permit_rejection_reason')->nullable();
        });

        $shops = DB::table('tailoring_shops')->pluck('id');

        foreach ($shops as $shopId) {
            $govId = DB::table('shop_documents')
                ->where('shop_id', $shopId)
                ->where('document_type', 'gov_id')
                ->first();

            $bir = DB::table('shop_documents')
                ->where('shop_id', $shopId)
                ->where('document_type', 'bir_2303')
                ->first();

            $dti = DB::table('shop_documents')
                ->where('shop_id', $shopId)
                ->where('document_type', 'dti_permit')
                ->first();

            DB::table('tailoring_shops')->where('id', $shopId)->update([
                'document_gov_id' => $govId?->file_path,
                'gov_id_status' => $govId?->status ?? 'pending',
                'gov_id_rejection_reason' => $govId?->rejection_reason,
                'document_bir' => $bir?->file_path,
                'bir_2303_status' => $bir?->status ?? 'pending',
                'bir_2303_rejection_reason' => $bir?->rejection_reason,
                'document_dti' => $dti?->file_path,
                'dti_permit_status' => $dti?->status ?? 'pending',
                'dti_permit_rejection_reason' => $dti?->rejection_reason,
            ]);
        }
    }
};
