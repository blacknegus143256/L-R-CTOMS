<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\TailoringShop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CustomerOrderController extends Controller
{
    private const VALID_STATUSES = ['Pending', 'Accepted', 'In Progress', 'Ready', 'Completed', 'Cancelled'];

    /**
     * Customer places a new order.
     * POST /api/shops/{shop}/orders
     */
    public function store(Request $request, TailoringShop $shop): JsonResponse
    {
        // Validate shop is active
        if (!$shop->is_active) {
            return response()->json(['message' => 'Shop not found.'], 404);
        }

        $valid = $request->validate([
            'service_id' => 'required|integer|exists:services,id',
            'attributes' => 'nullable|array',
            'attributes.*' => 'integer|exists:attribute_types,id',
            'notes' => 'nullable|string',
            // Customer fields (for new customer) OR customer_id (for existing)
            'customer_id' => 'nullable|integer|exists:customers,id',
            'customer_name' => 'nullable|string|max:255',
            'customer_phone' => 'nullable|string|max:50',
            'customer_email' => 'nullable|email|max:255',
            'customer_address' => 'nullable|string',
        ]);

        // Verify service belongs to this shop
        $service = $shop->services()->find($valid['service_id']);
        if (!$service) {
            return response()->json(['message' => 'Service not found in this shop.'], 422);
        }

        // Determine customer
        $customer = null;
        if (!empty($valid['customer_id'])) {
            // Use existing customer
            $customer = $shop->customers()->find($valid['customer_id']);
            if (!$customer) {
                return response()->json(['message' => 'Customer not found in this shop.'], 422);
            }
        } elseif (!empty($valid['customer_name'])) {
            // Create new customer
            $customer = $shop->customers()->create([
                'name' => $valid['customer_name'],
                'phone_number' => $valid['customer_phone'] ?? null,
                'email' => $valid['customer_email'] ?? null,
                'address' => $valid['customer_address'] ?? null,
            ]);
        } else {
            return response()->json(['message' => 'Customer information is required.'], 422);
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

        // Create order
        $order = Order::create([
            'tailoring_shop_id' => $shop->id,
            'customer_id' => $customer->id,
            'service_id' => $valid['service_id'],
            'status' => 'Pending',
            'total_price' => $totalPrice,
            'notes' => $valid['notes'] ?? null,
        ]);

        // Create order items
        foreach ($attributesData as $attrData) {
            OrderItem::create([
                'order_id' => $order->id,
                'attribute_type_id' => $attrData['attribute_type_id'],
                'price' => $attrData['price'],
            ]);
        }

        $order->load(['customer:id,name,phone_number,email', 'service:id,service_name,price', 'items.attribute']);

        return response()->json(['data' => $order], 201);
    }

    /**
     * Get authenticated customer's orders.
     * GET /api/customer/orders
     */
    public function index(Request $request): JsonResponse
    {
        // Check if user is authenticated (optional - guest checkout allowed)
        $userId = $request->user()?->id;
        
        // If user is logged in, get their customer records
        $customerIds = [];
        if ($userId) {
            // Get all shops owned by this user
            $shopIds = $request->user()->tailoringShops()->pluck('tailoring_shops.id');
            // Get customers belonging to those shops
            $customerIds = Customer::whereIn('tailoring_shop_id', $shopIds)->pluck('id')->toArray();
        }

        // Also check if there's a customer_id in session or request for guest orders
        $query = Order::with([
            'customer:id,name,phone_number,email',
            'service:id,service_name,price',
            'tailoringShop:id,shop_name',
            'items.attribute'
        ]);

        // If user is a shop owner, they can see their shop's orders
        if (!empty($customerIds)) {
            $query->whereIn('customer_id', $customerIds);
        } else {
            // For guests/customers without login, return empty or check for guest token
            return response()->json(['data' => []]);
        }

        $orders = $query->latest()->get();

        return response()->json(['data' => $orders]);
    }

    /**
     * Get a specific order.
     * GET /api/customer/orders/{order}
     */
    public function show(Request $request, Order $order): JsonResponse
    {
        // Check if user owns this order through their shops
        $shopIds = $request->user()?->tailoringShops()->pluck('tailoring_shops.id') ?? [];
        
        if (!$shopIds->contains($order->tailoring_shop_id)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $order->load([
            'customer:id,name,phone_number,email,address',
            'service:id,service_name,price,service_description',
            'tailoringShop:id,shop_name,contact_number',
            'items.attribute'
        ]);

        return response()->json(['data' => $order]);
    }
}

