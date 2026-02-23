<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TailoringShop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShopController extends Controller
{
    /**
     * List all approved & active tailoring shops.
     * Optional: ?search=... (shop name), ?attributes[]=1&attributes[]=2 (shops that have ALL these attributes).
     */
    public function index(Request $request): JsonResponse
    {
        $query = TailoringShop::query()
            ->where('is_active', true);

        if ($request->filled('search')) {
            $query->where('shop_name', 'like', '%' . $request->input('search') . '%');
        }

        $attributeIds = $request->input('attributes', []);
        if (is_array($attributeIds)) {
            $attributeIds = array_filter(array_map('intval', $attributeIds));
        } else {
            $attributeIds = [];
        }
        foreach ($attributeIds as $id) {
            $query->whereHas('attributes', fn ($q) => $q->where('attributes.id', $id));
        }

        // Filter by services if provided (OR logic - show shops with ANY of the selected services)
        $serviceIds = $request->input('services', []);
        if (is_array($serviceIds) && count($serviceIds) > 0) {
            $serviceIds = array_filter(array_map('intval', $serviceIds));
            if (count($serviceIds) > 0) {
                $query->whereHas('services', fn ($q) => $q->whereIn('services.id', $serviceIds));
            }
        }

        // Filter by service categories if provided (OR logic - show shops with ANY of the selected service categories)
        $serviceCategories = $request->input('service_categories', $request->input('service_categories[]', []));
        if (is_array($serviceCategories) && count($serviceCategories) > 0) {
            $serviceCategories = array_filter($serviceCategories);
            if (count($serviceCategories) > 0) {
                $query->whereHas('services', fn ($q) => $q->whereIn('service_category', $serviceCategories));
            }
        }

        $shops = $query->orderBy('shop_name')->get(['id', 'shop_name', 'address', 'contact_number', 'contact_person']);

        return response()->json(['data' => $shops]);
    }

    /**
     * Show a single shop with its services and attributes.
     */
    public function show(TailoringShop $shop): JsonResponse
    {
        if (! $shop->is_active) {
            return response()->json(['message' => 'Shop not found.'], 404);
        }

        $shop->load([
            'services:id,tailoring_shop_id,service_category,service_description,starting_price,turnaround_time,is_available,rush_service_available,appointment_required,notes',
            'attributes' => function ($q) {
                $q->withPivot('price', 'unit', 'notes', 'is_available');
            }
        ]);

        return response()->json(['data' => $shop]);
    }

    /**
     * Get two shops with their attributes and services for side-by-side comparison.
     * Query: ?shop1=1&shop2=2
     */
    public function compare(Request $request): JsonResponse
    {
        $id1 = $request->integer('shop1');
        $id2 = $request->integer('shop2');

        if (! $id1 || ! $id2 || $id1 === $id2) {
            return response()->json(['message' => 'Provide two different shop IDs (shop1, shop2).'], 422);
        }

        $shops = TailoringShop::query()
            ->where('is_active', true)
            ->whereIn('id', [$id1, $id2])
            ->with(['attributes' => function ($q) {
                $q->withPivot('price', 'unit', 'notes', 'is_available');
            }])
            ->with(['services:id,tailoring_shop_id,service_category,service_description,starting_price,turnaround_time,is_available,rush_service_available,appointment_required,notes'])
            ->get();

        if ($shops->count() !== 2) {
            return response()->json(['message' => 'One or both shops not found.'], 404);
        }

        return response()->json(['data' => $shops]);
    }
}
