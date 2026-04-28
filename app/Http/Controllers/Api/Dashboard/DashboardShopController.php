<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\TailoringShop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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
     * Update shop logo.
     */
    public function updateLogo(Request $request, TailoringShop $shop): JsonResponse
    {
        // Ensure ownership
       if ($shop->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'logo' => 'required|image|mimes:jpeg,png,jpg,webp,gif|max:2048',
        ]);

        // Delete old logo
        if ($shop->logo_url) {
            Storage::disk('public')->delete($shop->logo_url);
        }

        // Store new logo
        $path = $request->file('logo')->store('shop_logos', 'public');

        $shop->update([
            'logo_url' => $path,
        ]);

        return response()->json([
            'message' => 'Logo updated successfully',
            'logo_url' => Storage::url($path),
        ]);
    }

    /**
     * Get one shop (must belong to user).
     */
    public function show(Request $request, TailoringShop $shop): JsonResponse
    {
        // Ensure ownership (optimized, consistent with updateLogo, no query ID issues)
        if ($shop->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

$shop->load(['services', 'customers' => fn ($q) => $q->latest()->limit(5), 'user.profile']);

        return response()->json(['data' => $shop]);
    }

    /**
     * Update shop details (excluding logo)
     */
    public function update(Request $request, TailoringShop $shop): JsonResponse
    {
        if ($shop->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'shop_name' => 'string|max:255',
            'address' => 'string|max:500',
            'contact_number' => 'string|max:20',
            'contact_person' => 'string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        $shop->update($validated);

        return response()->json([
            'message' => 'Shop updated successfully',
            'data' => $shop->fresh()
        ]);
    }
}
