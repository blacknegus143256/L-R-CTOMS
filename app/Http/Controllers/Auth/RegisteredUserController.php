<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => 'required|string|in:customer,store_admin',
            'shop_name' => 'required_if:role,store_admin|nullable|string|max:255',
        ]);

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
            $user->tailoringShops()->create([
                'shop_name' => $validated['shop_name'],
                'contact_person' => $user->name,
                'contact_role'   => 'Owner',
                'status' => 'pending',
                'is_active'      => true,
            ]);
        }

        event(new Registered($user));

        Auth::login($user);

        if ($user->role === 'store_admin') {
            return redirect()->intended(route('store.dashboard'));
        }

        return redirect()->intended(route('dashboard'));

    }
}
