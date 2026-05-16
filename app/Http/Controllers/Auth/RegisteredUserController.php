<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('Auth/Register', [
            'redirectUrl' => $this->sanitizeRedirectUrl($request->string('redirect')->toString()),
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $redirectUrl = $this->sanitizeRedirectUrl($request->string('redirect')->toString());

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'terms' => 'accepted',
            'role' => 'required|string|in:customer,store_admin',
            'shop_name' => 'required_if:role,store_admin|nullable|string|max:255',
        ]);

        // Check if email exists but is unverified
        $existingUser = User::where('email', $validated['email'])
            ->whereNull('email_verified_at')
            ->first();

        if ($existingUser) {
            $loginUrl = route('login');
            if ($redirectUrl) {
                $loginUrl .= '?redirect=' . urlencode($redirectUrl);
            }

            return redirect($loginUrl)
                ->with('status', 'An account with this email already exists but is not verified. Please log in to complete your verification.');
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
        ]);

        $user->profile()->updateOrCreate([
            'user_id' => $user->id,
        ], []);

        if ($validated['role'] === 'store_admin') {
            // Default to Pending so new shops go through approval flow.
            $defaultStatusId = DB::table('shop_statuses')
                ->where('name', 'Pending')
                ->value('id') ?? 1;

            $user->tailoringShops()->create([
                'shop_name' => $validated['shop_name'],
                'contact_person' => $user->name,
                'contact_role'   => 'Owner',
                'status' => 'pending',
                // Default status for newly created shops (before documents approval)
                'shop_status_id' => $defaultStatusId,
                'is_active'      => true,
            ]);

            $request->session()->put('url.intended', route('store.onboarding'));
        }

        // Dispatch Registered event (this now calls our custom sendEmailVerificationNotification)
        event(new Registered($user));

        Auth::login($user);

        if ($redirectUrl && $validated['role'] !== 'store_admin') {
            $request->session()->put('url.intended', $redirectUrl);
        }

        return redirect()->route('verification.notice');
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

    private function issueVerificationCode(User $user): void
    {
        $code = (string) random_int(100000, 999999);

        $user->forceFill([
            'email_verification_code' => Hash::make($code),
            'email_verification_code_expires_at' => now()->addMinutes(15),
        ])->save();

        $user->sendVerificationCodeNotification($code);

    }
}
