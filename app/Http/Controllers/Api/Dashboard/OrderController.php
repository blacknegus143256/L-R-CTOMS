<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\AttributeType;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\TailoringShop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OrderController extends Controller
{
    private const VALID_STATUSES = ['Pending', 'Accepted', 'In Progress', 'Ready', 'Completed', 'Cancelled'];

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
            ->with(['customer:id,name,phone_number', 'service:id,service_name,price', 'items.attribute'])
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
            'attributes' => 'nullable|array',
            'attributes.*' => 'integer|exists:attribute_types,id',
            'status' => 'nullable|string|in:' . implode(',', self::VALID_STATUSES),
            'expected_completion_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $customer = $shop->customers()->find($valid['customer_id']);
        $service = $shop->services()->find($valid['service_id']);
        if (! $customer || ! $service) {
            return response()->json(['message' => 'Customer or service does not belong to this shop.'], 422);
        }

        // Calculate total price: service price + attribute prices
        $totalPrice = $service->price;
        $attributesData = [];

        if (!empty($valid['attributes'])) {
            // Get attribute prices from shop_attributes
            $shopAttributes = $shop->attributes()
                ->whereIn('attribute_types.id', $valid['attributes'])
                ->get()
                ->keyBy('id');

            foreach ($valid['attributes'] as $attributeId) {
                $shopAttr = $shopAttributes->get($attributeId);
                $attrPrice = $shopAttr ? $shopAttr->pivot->price : 0;
                $totalPrice += $attrPrice;

                $attributesData[] = [
                    'attribute_type_id' => $attributeId,
                    'price' => $attrPrice,
                ];
            }
        }

        $orderData = [
            'tailoring_shop_id' => $shop->id,
            'customer_id' => $valid['customer_id'],
            'service_id' => $valid['service_id'],
            'status' => $valid['status'] ?? 'Pending',
            'expected_completion_date' => $valid['expected_completion_date'] ?? null,
            'total_price' => $totalPrice,
            'notes' => $valid['notes'] ?? null,
        ];

        $order = Order::create($orderData);

        // Create order items
        foreach ($attributesData as $attrData) {
            OrderItem::create([
                'order_id' => $order->id,
                'attribute_type_id' => $attrData['attribute_type_id'],
                'price' => $attrData['price'],
            ]);
        }

        $order->load(['customer:id,name,phone_number', 'service:id,service_name,price', 'items.attribute']);

        return response()->json(['data' => $order], 201);
    }

    public function publicStore(Request $request, TailoringShop $shop)
{
    // 1. Validation (Note: customer_id is NOT required here because it's the auth user)
    $valid = $request->validate([
        'service_id' => 'required|exists:services,id',
        'attributes' => 'nullable|array',
        'attributes.*' => 'integer|exists:attribute_types,id',
        'notes' => 'nullable|string',
    ]);

    $service = $shop->services()->findOrFail($valid['service_id']);

    // 2. Calculate Total Price
    $totalPrice = $service->price;
    $attributesData = [];

    if (!empty($valid['attributes'])) {
        $shopAttributes = $shop->attributes()
            ->whereIn('attribute_types.id', $valid['attributes'])
            ->get()
            ->keyBy('id');

        foreach ($valid['attributes'] as $attributeId) {
            $shopAttr = $shopAttributes->get($attributeId);
            $attrPrice = $shopAttr ? $shopAttr->pivot->price : 0;
            $totalPrice += $attrPrice;

            $attributesData[] = [
                'attribute_type_id' => $attributeId,
                'price' => $attrPrice,
            ];
        }
    }

    // 3. Create the Order (Linking it to the logged-in user)
    $order = Order::create([
        'tailoring_shop_id' => $shop->id,
        'user_id' => Auth::id(), // The customer's User ID
        'service_id' => $valid['service_id'],
        'status' => 'Pending',
        'total_price' => $totalPrice,
        'notes' => $valid['notes'] ?? null,
    ]);

    // 4. Create Order Items
    foreach ($attributesData as $attrData) {
        $order->items()->create([
            'attribute_type_id' => $attrData['attribute_type_id'],
            'price' => $attrData['price'],
        ]);
    }

    // 5. Redirect back for Inertia
    return redirect()->back()->with('message', 'Order placed successfully!');
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
            'attributes' => 'sometimes|array',
            'attributes.*' => 'integer|exists:attribute_types,id',
            'status' => 'nullable|string|in:' . implode(',', self::VALID_STATUSES),
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

        // Handle attribute updates
        if (isset($valid['attributes'])) {
            $service = isset($valid['service_id']) 
                ? $shop->services()->find($valid['service_id']) 
                : $order->service;
            
            $totalPrice = $service->price;
            $attributesData = [];

            // Get attribute prices from shop_attributes
            $shopAttributes = $shop->attributes()
                ->whereIn('attribute_types.id', $valid['attributes'])
                ->get()
                ->keyBy('id');

            foreach ($valid['attributes'] as $attributeId) {
                $shopAttr = $shopAttributes->get($attributeId);
                $attrPrice = $shopAttr ? $shopAttr->pivot->price : 0;
                $totalPrice += $attrPrice;

                $attributesData[] = [
                    'attribute_type_id' => $attributeId,
                    'price' => $attrPrice,
                ];
            }

            // Delete existing order items and create new ones
            $order->items()->delete();
            foreach ($attributesData as $attrData) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'attribute_type_id' => $attrData['attribute_type_id'],
                    'price' => $attrData['price'],
                ]);
            }

            // Update total price if not manually set
            if (!isset($valid['total_price'])) {
                $valid['total_price'] = $totalPrice;
            }
        }

        $order->update($valid);

        return response()->json(['data' => $order->fresh(['customer:id,name,phone_number', 'service:id,service_name,price', 'items.attribute'])]);
    }

    public function destroy(Request $request, TailoringShop $shop, Order $order): JsonResponse
    {
        if (! $this->authorizeShop($request, $shop)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }
        if ($order->tailoring_shop_id != $shop->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        // Delete order items first (cascade should handle this, but being explicit)
        $order->items()->delete();
        $order->delete();

        return response()->json(['message' => 'Deleted'], 200);
    }
}
