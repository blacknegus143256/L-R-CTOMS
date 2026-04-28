<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\UserProfile;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
            'auth' => [
            'user' => $request->user()->load('profile'),
        ],
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();

        $request->validate([
            'avatar' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp,gif', 'max:2048'],
        ]);

        // Update basic user info
        $user->fill($request->validated());

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        // Enforce one profile record per user
        $profile = $user->profile()->updateOrCreate(['user_id' => $user->id]);

        // Avatar Upload
        if ($request->hasFile('avatar')) {
            // Delete old avatar
            if ($profile->avatar_url) {
                Storage::disk('public')->delete($profile->avatar_url);
            }

            // Store new avatar
            $path = $request->file('avatar')->store('avatars', 'public');

            $profile->avatar_url = $path;
        }

        // Update other profile fields
        $profile->update([
            'phone' => $request->phone,
            'street' => $request->street,
            'location_details' => $request->location_details,
            'barangay' => $request->barangay,
            // 'city' => $request->city, // adjust based on actual fields
            // 'province' => $request->province,
            'latitude' => $request->latitude ?? $profile->latitude,
            'longitude' => $request->longitude ?? $profile->longitude,
        ]);

        $profile->save();

        return Redirect::route('profile.edit')->with('status', 'profile-updated');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
