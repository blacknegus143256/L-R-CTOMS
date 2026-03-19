<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Auth;
class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role ?? 'customer',
        ]);
        
        Auth::login($user);

        $token = $user->createToken('dashboard')->plainTextToken;

        return response()->json([
            'user' => $user->only('id', 'name', 'email', 'role'),
            'token' => $token,
            'profile' => $user->profile,
            'token_type' => 'Bearer',
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user->tokens()->where('name', 'dashboard')->delete();
        Auth::login($user);
        
        $token = $user->createToken('dashboard')->plainTextToken;

        return response()->json([
            'user' => $user->only('id', 'name', 'email', 'role'),
            'token' => $token,
            'profile' => $user->profile,
            'token_type' => 'Bearer',
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out']);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->load('tailoringShops:id,shop_name,status,user_id,is_active,description,contact_person,contact_role',
        'profile');

        return response()->json([
            'user' => $user->only('id', 'name', 'email', 'role'),
            'shops' => $user->tailoringShops,
            'profile' => $user->profile,
        ]);
    }
}
