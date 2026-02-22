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
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => 'required|string|in:customer,store_admin', //this Validates the role
            'shop_name' => 'required_if:role,store_admin|string|max:255', //Only for store admins
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role, // Default role for new registrations
        ]);

        if($user->role === 'store_admin') {
            \App\Models\TailoringShop::create([
                'user_id' => $user->id,
                'shop_name' => $request->shop_name,
                'address' => 'Pending Address',
                'status' => 'pending', // New shops start as pending
            ]);
        }
        event(new Registered($user));

        Auth::login($user);

        return $user->role === 'store_admin' 
        ? redirect(route('store.dashboard'))
        : redirect(route('dashboard'));
    }
}
