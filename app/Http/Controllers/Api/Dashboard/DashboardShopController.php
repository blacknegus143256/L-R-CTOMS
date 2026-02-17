<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\TailoringShop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardShopController extends Controller
{
    /**
     * List shops the authenticated user can manage.
     */
    public function index(Request $request): JsonResponse
    {
        $shops = $request->user()
            ->tailoringShops()
            ->orderBy('shop_name')
            ->get(['id', 'shop_name', 'address', 'contact_number', 'contact_person']);

        return response()->json(['data' => $shops]);
    }

    /**
     * Get one shop (must belong to user).
     */
    public function show(Request $request, TailoringShop $shop): JsonResponse
    {
        if (! $request->user()->tailoringShops()->where('tailoring_shops.id', $shop->id)->exists()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $shop->load(['services', 'customers' => fn ($q) => $q->latest()->limit(5)]);

        return response()->json(['data' => $shop]);
    }
}
