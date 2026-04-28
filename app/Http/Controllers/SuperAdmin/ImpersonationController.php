<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class ImpersonationController extends Controller
{
    use AuthorizesRequests;

    /**
     * Impersonate a user (only super_admin can do this)
     */
    public function impersonate(User $user)
    {
        // Verify the current user is a super_admin
        if (!Auth::check() || Auth::user()->role !== 'super_admin') {
            throw new AuthorizationException('Only super admins can impersonate users.');
        }

        // Prevent impersonating other admins (security check)
        if (in_array($user->role, ['super_admin'])) {
            throw new AuthorizationException('Cannot impersonate admin users.');
        }

        // Store the original admin ID in session
        session()->put('impersonator_id', Auth::id());
        session()->put('impersonating_user_name', $user->name);

        // Log in as the target user
        Auth::login($user, remember: true);

        // Redirect to the target user's dashboard
        return redirect()->intended('/dashboard')->with('success', "Impersonating {$user->name}");
    }

    /**
     * Leave impersonation and restore the admin session
     */
    public function leaveImpersonation()
    {
        // Retrieve the original admin ID from session
        $impersonator_id = session()->pull('impersonator_id');
        session()->pull('impersonating_user_name');

        if (!$impersonator_id) {
            return redirect('/super-admin/users')->with('error', 'Not currently impersonating a user.');
        }

        // Find the original admin user
        $originalAdmin = User::find($impersonator_id);

        if (!$originalAdmin) {
            Auth::logout();
            return redirect('/login')->with('error', 'Original admin user not found.');
        }

        // Log back in as the admin
        Auth::login($originalAdmin, remember: true);

        return redirect('/super-admin/users')->with('success', 'Returned to Super Admin view.');
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
