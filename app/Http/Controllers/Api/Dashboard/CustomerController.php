<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\TailoringShop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
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

        $customers = $shop->customers()->orderBy('name')->get();

        return response()->json(['data' => $customers]);
    }

    public function store(Request $request, TailoringShop $shop): JsonResponse
    {
        if (! $this->authorizeShop($request, $shop)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $valid = $request->validate([
            'name' => 'required|string|max:255',
            'phone_number' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'measurements' => 'nullable|array',
        ]);

        $customer = $shop->customers()->create($valid);

        return response()->json(['data' => $customer], 201);
    }

    public function update(Request $request, TailoringShop $shop, Customer $customer): JsonResponse
    {
        if (! $this->authorizeShop($request, $shop)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }
        if ($customer->tailoring_shop_id != $shop->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $valid = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone_number' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'measurements' => 'nullable|array',
        ]);

        $customer->update($valid);

        return response()->json(['data' => $customer->fresh()]);
    }

    public function destroy(Request $request, TailoringShop $shop, Customer $customer): JsonResponse
    {
        if (! $this->authorizeShop($request, $shop)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }
        if ($customer->tailoring_shop_id != $shop->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $customer->delete();

        return response()->json(['message' => 'Deleted'], 200);
    }
}
