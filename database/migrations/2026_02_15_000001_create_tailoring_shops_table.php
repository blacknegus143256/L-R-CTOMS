<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tailoring_shops', function (Blueprint $table) {
            $table->id();
            $table->string('shop_name');
            $table->string('contact_person')->nullable();
            $table->string('contact_role')->default('Owner');
            $table->text('address')->default('Dumaguete City');
            $table->string('contact_number')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_approved')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tailoring_shops');
    }
};
