<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        // 1. Check if the user is logged in
        // 2. Check if their 'role' column matches the required role
        if (!$request->user() || $request->user()->role !== $role) {
            // If they are a customer trying to enter an admin page, send them home
            return redirect('/');
        }

        return $next($request);
    }
}