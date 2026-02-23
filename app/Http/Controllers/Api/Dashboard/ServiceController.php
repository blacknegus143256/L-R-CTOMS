<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\TailoringShop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    private function authorizeShop(Request $request, TailoringShop $shop): bool
    {
        return $request->user()->tailoringShops()->where('tailoring_shops.id', $shop->id)->exists();
    }

    public function index(Request $request, TailoringShop $shop): JsonResponse
    {
        if (! $this->authorizeShop($request, $shop)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $services = $shop->services()->orderBy('service_name')->get();

        return response()->json(['data' => $services]);
    }

    public function store(Request $request, TailoringShop $shop): JsonResponse
    {
        if (! $this->authorizeShop($request, $shop)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $valid = $request->validate([
            'service_category' => 'required|string|max:255',
            'service_description' => 'nullable|string',
            'starting_price' => 'required|numeric|min:0',
            'turnaround_time' => 'nullable|string|max:255',
            'is_available' => 'boolean',
            'rush_service_available' => 'boolean',
            'appointment_required' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        $service = $shop->services()->create($valid);

        return response()->json(['data' => $service], 201);
    }

    public function update(Request $request, TailoringShop $shop, Service $service): JsonResponse
    {
        if (! $this->authorizeShop($request, $shop)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }
        if ($service->tailoring_shop_id != $shop->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $valid = $request->validate([
            'service_category' => 'sometimes|string|max:255',
            'service_description' => 'nullable|string',
            'starting_price' => 'sometimes|numeric|min:0',
            'turnaround_time' => 'nullable|string|max:255',
            'is_available' => 'boolean',
            'rush_service_available' => 'boolean',
            'appointment_required' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        $service->update($valid);

        return response()->json(['data' => $service->fresh()]);
    }

    public function destroy(Request $request, TailoringShop $shop, Service $service): JsonResponse
    {
        if (! $this->authorizeShop($request, $shop)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }
        if ($service->tailoring_shop_id != $shop->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $service->delete();

        return response()->json(['message' => 'Deleted'], 200);
    }
}
