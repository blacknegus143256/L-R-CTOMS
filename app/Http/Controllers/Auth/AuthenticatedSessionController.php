<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
            'redirectUrl' => $this->sanitizeRedirectUrl($request->string('redirect')->toString()),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();
        $request->session()->regenerate();

        $user = $request->user();
        $redirectUrl = $this->sanitizeRedirectUrl($request->string('redirect')->toString());

        if ($redirectUrl) {
            $request->session()->put('url.intended', $redirectUrl);
        }

        if (! $user->hasVerifiedEmail()) {
            $this->issueVerificationCode($user);

            return redirect()->route('verification.notice')
                ->with('status', 'Your account is not yet verified. We have sent a new 6-digit code to your email.');
        }

        if ($user->role === 'super_admin') {
            return redirect()->intended(route('super.dashboard'));
        }

        if ($user->role === 'store_admin') {
            return redirect()->intended(route('store.dashboard'));
        }

        if (in_array($user->role, ['store_staff', 'staff'], true)) {
            return redirect()->intended(route('staff.dashboard'));
        }

        return redirect()->intended(route('dashboard'));
    }  
    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }

    private function sanitizeRedirectUrl(?string $redirectUrl): ?string
    {
        if (! $redirectUrl) {
            return null;
        }

        if (! str_starts_with($redirectUrl, '/')) {
            return null;
        }

        if (str_starts_with($redirectUrl, '//')) {
            return null;
        }

        return $redirectUrl;
    }

    private function issueVerificationCode(object $user): void
    {
        $code = (string) random_int(100000, 999999);

        $user->forceFill([
            'email_verification_code' => Hash::make($code),
            'email_verification_code_expires_at' => now()->addMinutes(15),
        ])->save();

        $user->sendVerificationCodeNotification($code);
    }
}
