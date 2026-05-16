<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Throwable;

class VerifyEmailController extends Controller
{
    public function sendCode(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return redirect()->intended(route('dashboard', absolute: false).'?verified=1');
        }

        $code = (string) random_int(100000, 999999);

        $user->forceFill([
            'email_verification_code' => Hash::make($code),
            'email_verification_code_expires_at' => now()->addMinutes(15),
        ])->save();

        try {
            $user->sendVerificationCodeNotification($code);
        } catch (Throwable $throwable) {
            Log::warning('Verification code email delivery failed; exposing code in session fallback.', [
                'user_id' => $user->id,
                'email' => $user->email,
                'error' => $throwable->getMessage(),
            ]);
        }

        return back()->with([
            'status' => 'verification-code-sent',
            'verification_code' => $code,
        ]);
    }

    public function verifyCode(Request $request): RedirectResponse
    {
        $request->validate([
            'code' => ['required', 'digits:6'],
        ]);

        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return redirect()->intended(route('dashboard', absolute: false).'?verified=1');
        }

        $storedCode = $user->email_verification_code;
        $expiresAt = $user->email_verification_code_expires_at;

        if (! $storedCode || ! $expiresAt || now()->greaterThan($expiresAt) || ! Hash::check($request->string('code')->toString(), $storedCode)) {
            return back()->withErrors([
                'code' => 'The verification code is invalid or has expired.',
            ]);
        }

        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        $user->forceFill([
            'email_verification_code' => null,
            'email_verification_code_expires_at' => null,
        ])->save();

        return redirect()->intended(route('dashboard', absolute: false).'?verified=1');
    }
}
