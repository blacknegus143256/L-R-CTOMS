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
use Illuminate\Support\Facades\Storage;

class CustomerOrderController extends Controller
{
    private const VALID_STATUSES = ['Pending', 'Accepted', 'In Progress', 'Ready', 'Completed', 'Cancelled'];

    /**
     * Customer places a new order.
     * POST /api/shops/{shop}/orders
     * 
     * Payload:
     * {
     *   "service_id": 5,
     *   "attributes": [3, 7, 9],
     *   "notes": "Make it tighter"
     * }
     * 
     * Backend automatically handles customer from authenticated user.
     */
    public function store(Request $request, TailoringShop $shop): JsonResponse
    {
        // Validate shop is active
        if (!$shop->is_active) {
            return response()->json(['message' => 'Shop not found.'], 404);
        }

$valid = $request->validate([
            'service_id' => 'required|integer|exists:services,id',
            'style_tag' => 'nullable|string|max:255',
'material_source' => 'required|in:customer,shop',
            'design_image' => 'nullable|image|max:5120',
            'measurement_type' => 'required|in:profile,inperson',
            'material_dropoff_date' => 'required|date|after_or_equal:today',
            'attributes' => 'nullable|array',

            'attributes.*' => 'integer|exists:attribute_types,id',
            'notes' => 'nullable|string',
        ]);

    // Handle image upload
    if ($request->hasFile('design_image')) {
        $imagePath = $request->file('design_image')->store('orders/images', 'public');
        $valid['design_image'] = $imagePath;
    }

        // Verify service belongs to this shop
        $service = $shop->services()->find($valid['service_id']);
        if (!$service) {
            return response()->json(['message' => 'Service not found in this shop.'], 422);
        }

        // Determine customer - either from authenticated user or guest
        $customer = $this->resolveCustomer($request, $shop);

        if (!$customer) {
            return response()->json([
                'message' => 'Please complete your profile to place an order.',
                'requires_profile' => true
            ], 422);
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

        $user = $request->user();
        $orderData = [
            'tailoring_shop_id' => $shop->id,
            'customer_id' => $customer->id,
            'service_id' => $valid['service_id'],
            'style_tag' => $valid['style_tag'] ?? null,
            'material_source' => $valid['material_source'],
            'design_image' => $valid['design_image'] ?? null,
            'measurement_type' => $valid['measurement_type'],
'material_dropoff_date' => $valid['material_dropoff_date'],
        ];

        // Legacy snapshot removed - using new JSON measurement system
        $orderData['measurement_preference'] = $valid['measurement_preference'] ?? null;

        $orderData['status'] = ($valid['material_source'] === 'customer') ? 'Awaiting Materials' : 'Pending';

        $orderData['total_price'] = $totalPrice;
        $orderData['notes'] = $valid['notes'] ?? null;

        $order = Order::create($orderData);

        // Create order items
        foreach ($attributesData as $attrData) {
            OrderItem::create([
                'order_id' => $order->id,
                'attribute_type_id' => $attrData['attribute_type_id'],
                'price' => $attrData['price'],
            ]);
        }

        $order->load(['customer:id,name,phone,email', 'service:id,service_name,price', 'items.attribute']);

        return response()->json(['data' => $order], 201);
    }

    /**
     * Resolve customer - either from authenticated user or return null for guest
     */
    private function resolveCustomer(Request $request, TailoringShop $shop): ?Customer
    {
        $user = $request->user();

        // If user is authenticated, create/find customer from their profile
        if ($user) {
            // Try to find existing customer for this user + shop combination
            $customer = Customer::where('user_id', $user->id)
                ->where('tailoring_shop_id', $shop->id)
                ->first();

            if (!$customer) {
                // Get user profile
                $profile = $user->profile;

                // Create new customer from user data
                $customer = Customer::create([
                    'user_id' => $user->id,
                    'tailoring_shop_id' => $shop->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $profile?->phone ?? null,
                    'address' => $profile?->street ? 
                        ($profile->street . ', ' . $profile->barangay) : null,
                ]);
            }

            return $customer;
        }

        // For guests, return null - they need to login or provide info
        return null;
    }

    /**
     * Get authenticated customer's orders.
     * GET /api/customer/orders
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['data' => []]);
        }

        // Get all customer records for this user across all shops
        $customerIds = Customer::where('user_id', $user->id)->pluck('id')->toArray();

        if (empty($customerIds)) {
            return response()->json(['data' => []]);
        }

        $orders = Order::with([
            'customer:id,name,phone,email',
            'service:id,service_name,price',
            'tailoringShop:id,shop_name',
            'items.attribute'
        ])
        ->whereIn('customer_id', $customerIds)
        ->latest()
        ->get();

        return response()->json(['data' => $orders]);
    }

    /**
     * Get a specific order.
     * GET /api/customer/orders/{order}
     */
    public function show(Request $request, Order $order): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        // Verify the order belongs to a customer owned by this user
        $customer = $order->customer;
        if (!$customer || $customer->user_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $order->load([
            'customer:id,name,phone,email,address',
            'service:id,service_name,price,service_description',
            'service.serviceCategory:id,name',
            'attributes.attributeCategory:id,name',
            'attributes' => function ($q) {
                $q->with('attributeCategory:id,name')
                  ->withPivot('price', 'unit', 'notes');
            },
            'tailoringShop:id,shop_name,phone,street,barangay',
            'items.attribute'
        ]);

        return response()->json(['data' => $order]);
    }

    /**
     * Update measurements for customer order.
     * PATCH /my-orders/{order}/measurements
     */
    public function updateMeasurements(Request $request, Order $order)
    {
        $user = $request->user();

        // Verify order belongs to this user
        if ($order->user_id !== $user->id) {
            abort(403, 'Forbidden.');
        }

        $validated = $request->validate([
            'measurements' => 'required|array',
            'measurements.*' => 'numeric|min:0',
        ]);

        $snapshot = $order->measurement_snapshot ?? ['requested' => [], 'values' => []];
        $snapshot['values'] = $validated['measurements'];

        $order->update(['measurement_snapshot' => $snapshot]);

        return back()->with('message', 'Measurements submitted successfully!');
    }

    /**
     * Check if user has complete profile for ordering.
     * GET /api/customer/profile-check
     */
    public function checkProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'complete' => false,
                'message' => 'Please login to place orders.'
            ]);
        }

        $profile = $user->profile;
        
        // Check required fields
        $hasPhone = !empty($profile?->phone);
        $hasAddress = !empty($profile?->street) || !empty($profile?->barangay);

        return response()->json([
            'complete' => $hasPhone && $hasAddress,
            'has_phone' => $hasPhone,
            'has_address' => $hasAddress,
            'message' => !$hasPhone ? 'Please add phone number to your profile.' : 
                         (!$hasAddress ? 'Please add address to your profile.' : 'Profile complete.')
        ]);
    }
}

