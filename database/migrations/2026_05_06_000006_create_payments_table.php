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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('payment_type')->nullable();
            $table->string('payment_status')->default('Pending');
            $table->decimal('amount', 12, 2);
            $table->string('manual_payment_reference_id')->nullable();
            $table->string('manual_payment_proof_path')->nullable();
            $table->string('paymongo_link_id')->nullable();
            $table->string('paymongo_payment_id')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};