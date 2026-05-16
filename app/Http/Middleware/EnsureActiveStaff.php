<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveStaff
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! in_array($user->role, ['store_staff', 'staff'], true)) {
            return $next($request);
        }

        $hasActiveShop = $user->workplaces()->wherePivot('is_active', true)->exists();

        if (! $hasActiveShop) {
            if ($request->routeIs('staff.dashboard')) {
                return $next($request);
            }

            if ($request->routeIs('staff.orders', 'staff.appointments')) {
                return redirect()->route('staff.dashboard');
            }

            if ($request->expectsJson()) {
                abort(403, 'Access revoked.');
            }

            return redirect()->route('staff.dashboard');
        }

        return $next($request);
    }
}