<?php

namespace App\Http\Middleware;

use App\Http\Controllers\SuperAdmin\ImpersonationController;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ImpersonationMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Share impersonation state with Inertia
        if (optional(auth())->check()) {
            $impersonationStatus = ImpersonationController::getImpersonationStatus();
            
            // Add to Inertia shared data
            \Inertia\Inertia::share('impersonation', $impersonationStatus);
        }

        return $next($request);
    }
}
