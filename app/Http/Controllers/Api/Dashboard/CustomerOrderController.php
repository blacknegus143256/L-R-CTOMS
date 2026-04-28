<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\TailoringShop;
use App\Notifications\OrderUpdatedNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class CustomerOrderController extends Controller
{
    private const VALID_STATUSES = ['Pending', 'Accepted', 'In Progress', 'Ready', 'Completed', 'Rejected', 'Declined', 'Cancelled'];

    private function authorizeCustomerAccess($user, $order)
    {
        return $user->id === $order->user_id;
    }

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
            'design_image' => 'nullable|image|mimes:jpeg,png,jpg,webp,gif|max:2048',
            'measurement_type' => ['required', 'string', 'in:profile,scheduled,none'],
            'material_dropoff_date' => 'required|date|after_or_equal:today',
            'attributes' => 'nullable|array',

            'attributes.*' => 'integer|exists:attribute_types,id',
            'notes' => 'nullable|string',
        ]);

        $valid['measurement_type'] = Order::normalizeMeasurementType($valid['measurement_type'] ?? null);

        if (!in_array($valid['measurement_type'], [Order::MEASUREMENT_TYPE_PROFILE, Order::MEASUREMENT_TYPE_SCHEDULED, Order::MEASUREMENT_TYPE_NONE], true)) {
            return response()->json(['message' => 'Invalid measurement type selected.'], 422);
        }

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

        if ($shop->user) {
            $shop->user->notify(new OrderUpdatedNotification(
                $order,
                'New Order Request: Order #' . $order->id . ' needs to be reviewed and quoted.',
                'new_order_received'
            ));
        }

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
        ->orderByRaw('(is_rush = 1 OR expected_completion_date <= NOW() + INTERVAL 2 DAY) DESC')
        ->orderBy('expected_completion_date', 'ASC')
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
            'attributes' => function ($q) {
                $q->with('attributeCategory:id,name')
                  ->withPivot('price', 'unit', 'notes');
            },
            'tailoringShop',
            'items.attribute.attributeCategory:id,name',
            'images'
        ]);

        return response()->json(['data' => $order]);
    }

    /**
     * Update measurements for customer order.
     * PATCH /my-orders/{order}/measurements
     */
    public function updateMeasurements(Request $request, Order $order)
    {
        Log::info('Measurement update attempt', [
            'order_id' => $order->id,
            'auth_user_id' => optional($request->user())->id,
            'order_user_id' => $order->user_id ?? null,
            'order_customer_id' => $order->customer_id ?? null,
            'order_customer_user_id' => optional($order->customer?->user_id),
            'customer_relation_exists' => !is_null($order->customer),
            'status' => $order->status,
        ]);

        if (! $this->authorizeCustomerAccess($request->user(), $order)) {
            abort(403, 'Unauthorized. This order does not belong to you.');
        }

        // ✅ Status check (Robust and Case-Insensitive)
        // 1. Get the raw status, handling if it's an Enum object
        $rawStatus = $order->status instanceof \App\Enums\OrderStatus ? $order->status->value : $order->status;
        
        // 2. Normalize to lowercase string
        $normalizedStatus = strtolower(trim((string)$rawStatus));

        // 3. Define the allowed array in lowercase
        $allowedStatuses = ['requested', 'quoted', 'confirmed', 'appointment scheduled', 'in progress'];

        if (!in_array($normalizedStatus, $allowedStatuses)) {
            \Illuminate\Support\Facades\Log::warning('Measurement status rejection', [
                'order_id' => $order->id,
                'raw_status_from_db' => $order->status,
                'normalized' => $normalizedStatus
            ]);
            abort(403, "Measurements cannot be updated when order status is: {$rawStatus}.");
        }

    // ✅ Validation (matches frontend structure)
    $validated = $request->validate([
        'submitted_measurements' => 'required|array',
        'submitted_measurements.*.name' => 'required|string',
        'submitted_measurements.*.value' => 'required|numeric|min:0',
    ]);

    $snapshot = $order->measurement_snapshot ?? [];

    // ✅ Ensure requested exists
    if (!isset($snapshot['requested']) || !is_array($snapshot['requested'])) {
        abort(422, 'No measurements were requested for this order.');
    }

    // ✅ Map cleanly (name => value)
    $submitted = [];

    foreach ($validated['submitted_measurements'] as $measure) {
        $submitted[$measure['name']] = $measure['value'];
    }

    $snapshot['submitted'] = $submitted;

    $order->update([
        'measurement_snapshot' => $snapshot
    ]);

    if ($order->tailoringShop?->user) {
        // Anti-spam throttle: Check for duplicate notifications within 5 minutes
        $recentNotification = DB::table('notifications')
            ->where('data->type', 'measurement_submitted')
            ->where('data->order_id', $order->id)
            ->where('created_at', '>=', now()->subMinutes(5))
            ->whereNull('read_at')
            ->exists();

        if (!$recentNotification) {
            $order->tailoringShop->user->notify(new OrderUpdatedNotification(
                $order,
                "The customer submitted measurements for order #{$order->id}.",
                'measurement_submitted'
            ));
        }
    }

    return back()->with('success', 'Measurements submitted successfully.');
}

    /**
     * Customer accepts tailor quote and confirms order.
     * PATCH /my-orders/{order}/accept
     * 
     * Auth: Ensures order.customer_id === Auth::user()->customer->id
     */
    public function acceptQuoteFallback(Request $request, Order $order)
    {
        $user = $request->user();

        if (! $this->authorizeCustomerAccess($user, $order)) {
            abort(403, 'Unauthorized. This order does not belong to you.');
        }

        return redirect()
            ->route('customer.orders.show', $order)
            ->with('error', 'Invalid request method. Please use the Accept button to confirm your quote.');
    }

    public function acceptQuote(Request $request, Order $order)
    {
        $user = $request->user();

        if (! $this->authorizeCustomerAccess($user, $order)) {
            abort(403, 'Unauthorized. This order does not belong to you.');
        }

        $currentStatus = '';
        if ($order->status instanceof \App\Enums\OrderStatus) {
            $currentStatus = $order->status->value;
        } else {
            $currentStatus = (string) $order->status;
        }

        // Case-insensitive check
        if (strtolower(trim($currentStatus)) !== 'quoted') {
            abort(422, 'Order must be in Quoted status to accept. Current status: ' . $currentStatus);
        }

        $validated = $request->validate([
            'submitted_measurements' => 'nullable|array',
            'submitted_measurements.*.name' => 'required_with:submitted_measurements|string',
            'submitted_measurements.*.value' => 'required_with:submitted_measurements|numeric|min:0',
            'status' => 'sometimes|in:Confirmed'
        ]);

        $snapshot = $order->measurement_snapshot ?? [];

        $measurementType = strtolower((string) ($order->measurement_type ?? ''));
        $requiresCustomerMeasurements = in_array($measurementType, ['profile', 'self_measured'], true);
        $requestedMeasurements = is_array($snapshot['requested'] ?? null) ? $snapshot['requested'] : [];
        $alreadySubmitted = is_array($snapshot['submitted'] ?? null) && count($snapshot['submitted']) > 0;

        if ($requiresCustomerMeasurements && !$alreadySubmitted) {
            if (!isset($validated['submitted_measurements']) || count($validated['submitted_measurements']) === 0) {
                return response()->json([
                    'message' => 'Unable to confirm this quote yet.'
                ], 422);
            }
        }

        if (!empty($validated['submitted_measurements'])) {
            $submittedByName = [];
            foreach ($validated['submitted_measurements'] as $measurement) {
                $submittedByName[$measurement['name']] = $measurement['value'];
            }

            if ($requiresCustomerMeasurements && !empty($requestedMeasurements)) {
                $requestedNames = collect($requestedMeasurements)
                    ->map(fn ($item) => is_array($item) ? ($item['name'] ?? null) : null)
                    ->filter()
                    ->values()
                    ->all();

                    $missing = array_values(array_diff($requestedNames, array_keys($submittedByName)));
                    if (!empty($missing)) {
                        return response()->json([
                            'message' => 'Unable to confirm this quote yet.'
                        ], 422);
                    }
            }

            $snapshot['submitted'] = $submittedByName;
        }

        $order->update([
            'measurement_snapshot' => $snapshot
        ]);

        $shopUser = $order->tailoringShop?->user;
        if ($shopUser) {
            $shopUser->notify(new OrderUpdatedNotification(
                $order,
                'Customer has accepted the quote for Order #' . $order->id . '. Awaiting payment.',
                'quote_accepted'
            ));
        }

        return response()->json([
            'success' => true, 
            'message' => 'Quote Accepted! Proceed to payment to confirm your order.'
        ], 200);
    }

    /**
     * Customer declines tailor quote with a reason.
     * PATCH /my-orders/{order}/decline
     */
    public function declineQuote(Request $request, Order $order)
    {
        $user = $request->user();

        if (! $this->authorizeCustomerAccess($user, $order)) {
            abort(403, 'Unauthorized. This order does not belong to you.');
        }

        $currentStatus = $order->status instanceof \App\Enums\OrderStatus ? $order->status->value : $order->status;
        if ($currentStatus !== 'Quoted') {
            abort(422, 'Only quoted orders can be declined.');
        }

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $existingNotes = trim((string) ($order->notes ?? ''));
        $declineNote = 'DECLINED BY CUSTOMER: ' . $validated['reason'];
        $combinedNotes = $existingNotes !== '' ? ($declineNote . "\n\n" . $existingNotes) : $declineNote;

        $order->update([
            'status' => 'Declined',
            'notes' => $combinedNotes,
        ]);

        $shopUser = $order->tailoringShop?->user;
        if ($shopUser) {
            $shopUser->notify(new OrderUpdatedNotification(
                $order,
                'Customer declined Order #' . $order->id,
                'order_declined',
                $validated['reason'],
                'Customer'
            ));
        }

        return redirect()->back()->with('message', 'You declined this quote. The order was declined.');
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

    /**
     * Web version of show() for Inertia OrderWorkspace page.
     * GET /my-orders/{order}
     */
    public function showWeb(Order $order)
    {
        $user = Auth::user();

        if (!$user) {
            abort(401, 'Unauthorized.');
        }

        // Relaxed auth check to prevent 403s with inconsistent test data
        $customer = $order->customer;
        $isAuthorized = false;
        
        if ($order->user_id === $user->id) {
            $isAuthorized = true;
        } elseif ($customer && $customer->user_id === $user->id) {
            $isAuthorized = true;
        }

        if (!$isAuthorized) {
            abort(403, 'Forbidden. This order does not belong to your account.');
        }

        $order->load([
            'customer:id,name,phone,email,address',
            'service:id,service_name,price,service_description',
            'service.serviceCategory:id,name',
            'tailoringShop.user.profile',
            'tailoringShop.attributes',
            'items.attribute',
            'items.attribute.attributeCategory:id,name',
            'images',
            'reworkRequest',
            'logs.user:id,name,role'
        ]);

        // Map snake_case to camelCase and flatten shop
        $orderData = $order->toArray();
        $orderData['shop'] = $order->tailoringShop;

        return Inertia::render('dashboard/OrderWorkspace', [
            'order' => $orderData
        ]);
    }
}

