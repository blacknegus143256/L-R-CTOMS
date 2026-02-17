<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserCanAccessShop
{
    public function handle(Request $request, Closure $next): Response
    {
        $shop = $request->route('shop');

        if (! $shop || ! $request->user()->tailoringShops()->where('tailoring_shops.id', $shop->id)->exists()) {
            return response()->json(['message' => 'You do not have access to this shop.'], 403);
        }

        return $next($request);
    }
}
