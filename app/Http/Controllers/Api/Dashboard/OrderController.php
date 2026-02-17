<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\TailoringShop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
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

        $orders = $shop->orders()
            ->with(['customer:id,name,phone_number', 'service:id,service_name,price'])
            ->latest()
            ->get();

        return response()->json(['data' => $orders]);
    }

    public function store(Request $request, TailoringShop $shop): JsonResponse
    {
        if (! $this->authorizeShop($request, $shop)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $valid = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'service_id' => 'required|exists:services,id',
            'status' => 'nullable|string|in:Pending,Measuring,Sewing,Ready,Completed',
            'expected_completion_date' => 'nullable|date',
            'total_price' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $customer = $shop->customers()->find($valid['customer_id']);
        $service = $shop->services()->find($valid['service_id']);
        if (! $customer || ! $service) {
            return response()->json(['message' => 'Customer or service does not belong to this shop.'], 422);
        }

        $valid['tailoring_shop_id'] = $shop->id;
        $valid['status'] = $valid['status'] ?? 'Pending';
        $order = Order::create($valid);

        $order->load(['customer:id,name,phone_number', 'service:id,service_name,price']);

        return response()->json(['data' => $order], 201);
    }

    public function update(Request $request, TailoringShop $shop, Order $order): JsonResponse
    {
        if (! $this->authorizeShop($request, $shop)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }
        if ($order->tailoring_shop_id != $shop->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $valid = $request->validate([
            'customer_id' => 'sometimes|exists:customers,id',
            'service_id' => 'sometimes|exists:services,id',
            'status' => 'nullable|string|in:Pending,Measuring,Sewing,Ready,Completed',
            'expected_completion_date' => 'nullable|date',
            'total_price' => 'sometimes|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        if (isset($valid['customer_id']) && ! $shop->customers()->where('id', $valid['customer_id'])->exists()) {
            return response()->json(['message' => 'Customer does not belong to this shop.'], 422);
        }
        if (isset($valid['service_id']) && ! $shop->services()->where('id', $valid['service_id'])->exists()) {
            return response()->json(['message' => 'Service does not belong to this shop.'], 422);
        }

        $order->update($valid);

        return response()->json(['data' => $order->fresh(['customer:id,name,phone_number', 'service:id,service_name,price'])]);
    }

    public function destroy(Request $request, TailoringShop $shop, Order $order): JsonResponse
    {
        if (! $this->authorizeShop($request, $shop)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }
        if ($order->tailoring_shop_id != $shop->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $order->delete();

        return response()->json(['message' => 'Deleted'], 200);
    }
}
