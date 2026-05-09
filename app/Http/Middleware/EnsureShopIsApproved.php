<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureShopIsApproved
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $shop = $request->user()?->tailoringShop;
        $hasBirDocument = $shop?->documents()->where('document_type', 'bir_2303')->exists();

        if (! $shop || ! $hasBirDocument) {
            return redirect()->route('store.onboarding');
        }

        return $next($request);
    }
}
