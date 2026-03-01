<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attribute_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attribute_category_id')->constrained('attribute_categories')->cascadeOnDelete();
            $table->string('name');
            $table->timestamps();
            $table->unique(['name', 'attribute_category_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attribute_types');
    }
};
