<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (app()->environment('production')) {
            $user = User::where('email', 'admin@gmail.com')->first();

            if ($user) {
                $user->forceFill([
                    'email' => 'stitchcentral.admin@gmail.com',
                    'password' => Hash::make('NewAdmin123!'),
                    'email_verified_at' => now(),
                ])->save();
                Log::info('Super admin credentials migration applied.', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // One-way data patch. No rollback logic required.
    }
};
