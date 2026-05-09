<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ImpersonationController extends Controller
{
    use AuthorizesRequests;

    /**
     * Impersonate a user (only super_admin can do this)
     */
    public function impersonate(Request $request, User $user)
    {
        if (!Auth::check() || Auth::user()->role !== 'super_admin') {
            throw new AuthorizationException('Only super admins can impersonate users.');
        }
        if (in_array($user->role, ['super_admin'])) {
            throw new AuthorizationException('Cannot impersonate admin users.');
        }

        // Grab the admin ID before switching
        $adminId = Auth::id();

        // Log in as the target user (This regenerates the session)
        Auth::login($user, remember: true);

        // Store in session AFTER login so it binds to the new secure session
        session()->put('impersonator_id', $adminId);
        session()->put('impersonating_user_name', $user->name);
        session()->save(); // Force save to guarantee persistence

        Log::info("AUDIT: Super Admin [ID: {$adminId}] initiated impersonation of User [ID: {$user->id}, Name: {$user->name}] at " . now());

        $redirectTo = $request->input('redirect_to', '/dashboard');
        if (!is_string($redirectTo)) {
            $redirectTo = '/dashboard';
        } elseif (!str_starts_with($redirectTo, '/')) {
            $redirectTo = '/dashboard';
        } elseif (str_starts_with($redirectTo, '//')) {
            $redirectTo = '/dashboard';
        }

        return redirect()->intended($redirectTo)->with('success', "Impersonating {$user->name}");
    }

    /**
     * Leave impersonation and restore the admin session
     */
    public function leaveImpersonation()
    {
        // 1. Security Check: Only proceed if they are actually impersonating someone
        if (!session()->has('impersonator_id')) {
            abort(403, 'You are not currently impersonating anyone.');
        }

        $impersonator_id = session()->pull('impersonator_id');
        $impersonated_name = session()->pull('impersonating_user_name');

        $originalAdmin = User::find($impersonator_id);

        if (!$originalAdmin) {
            Auth::logout();
            Log::warning("AUDIT: Failed impersonation exit. Original admin ID {$impersonator_id} not found.");
            return redirect('/login')->with('error', 'Original admin user not found.');
        }

        $impersonatedId = Auth::id(); // Get the ID of the user they were just impersonating

        // Log back in as the admin
        Auth::login($originalAdmin, remember: true);
        session()->save();

        Log::info("AUDIT: Super Admin [ID: {$originalAdmin->id}] successfully exited impersonation of User [ID: {$impersonatedId}, Name: {$impersonated_name}] at " . now());

        return redirect()->route('super.users.index')->with('success', 'Returned to Super Admin view.');
    }

    /**
     * Get impersonation status (for React frontend)
     * Called by a middleware to populate Inertia props
     */
    public static function getImpersonationStatus()
    {
        return [
            'is_impersonating' => session()->has('impersonator_id'),
            'impersonating_user_name' => session()->get('impersonating_user_name'),
            'original_admin_id' => session()->get('impersonator_id'),
        ];
    }
}
