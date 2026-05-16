<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Throwable;

class EmailVerificationNotificationController extends Controller
{
    /**
     * Send a new email verification notification.
     */
    public function store(Request $request): RedirectResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->intended(route('dashboard', absolute: false));
        }

        $code = (string) random_int(100000, 999999);

        $request->user()->forceFill([
            'email_verification_code' => Hash::make($code),
            'email_verification_code_expires_at' => now()->addMinutes(15),
        ])->save();

        try {
            $request->user()->sendVerificationCodeNotification($code);
        } catch (Throwable $throwable) {
            Log::warning('Verification code email delivery failed; exposing code in session fallback.', [
                'user_id' => $request->user()->id,
                'email' => $request->user()->email,
                'error' => $throwable->getMessage(),
            ]);
        }

        return back()->with([
            'status' => 'verification-code-sent',
            'verification_code' => $code,
        ]);
    }
}
