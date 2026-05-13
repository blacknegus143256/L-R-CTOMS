<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AttributeCategory;
use App\Models\AttributeType;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\OrderStatus as OrderStatusLookup;
use App\Models\ShopSchedule;
use App\Models\TailoringShop;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use App\Enums\OrderStatus;
use App\Notifications\OrderUpdatedNotification;
use App\Notifications\NewOrderReceivedNotification;
use App\Notifications\OrderUpdateNotification;
use App\Models\OrderService;
use App\Models\UserMeasurement;

class OrderController extends Controller
{

    private function logOrderActivity(Order $order, ?int $userId, string $action, string $description): void
    {
        // Migration-safe scaffold: no-op until order_logs exists.
        if (!Schema::hasTable('order_logs')) {
            return;
        }

        DB::table('order_logs')->insert([
            'order_id' => $order->id,
            'user_id' => $userId,
            'action' => $action,
            'description' => $description,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function authorizeShop(Request $request, TailoringShop $shop): bool
    {
        return $request->user()->tailoringShops()->where('tailoring_shops.id', $shop->id)->exists();
    }

    private function calculateShopDeadline($shopId, $startDate, $daysToAdd)
    {
        $date = $startDate->copy();
        $daysAdded = 0;
        // Fetch the shop's schedule and key by day of week (0 = Sunday, 1 = Monday)
        $schedule = ShopSchedule::where('shop_id', $shopId)->get()->keyBy('day_of_week');

        while ($daysAdded < $daysToAdd) {
            $date->addDay();
            $dayOfWeek = $date->dayOfWeek;
            // Only increment daysAdded if the shop is explicitly open on this day
            if (isset($schedule[$dayOfWeek]) && $schedule[$dayOfWeek]->is_open) {
                $daysAdded++;
            }
        }
        return $date->startOfDay();
    }

    public function index(Request $request, TailoringShop $shop)
    {
        if (! $this->authorizeShop($request, $shop)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $orders = $shop->orders()
            ->with(['customer:id,name,phone_number', 'orderServices.service:id,service_name,price,service_category_id', 'orderServices.service.serviceCategory', 'items.shopAttribute.attributeType', 'fitMethod', 'appointments', 'status', 'payment.status'])
            ->orderByRaw('(is_rush = 1 OR expected_completion_date <= NOW() + INTERVAL 2 DAY) DESC')
            ->orderBy('expected_completion_date', 'ASC')
            ->get();

        return ['data' => $orders];
    }

    public function show(Request $request, TailoringShop $shop, Order $order)
    {
        if (! $this->authorizeShop($request, $shop)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }
        if ($order->tailoring_shop_id != $shop->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $order->load([
            'customer:id,name,email,',
            'customer.profile',
            'user:id,name,email',
            'user.profile',
            'fitMethod',
            'status',
            'payment.status',
            'appointments',
            'orderServices.service:id,service_name,price,service_description,duration_days,appointment_required',
            'orderServices.service.serviceCategory:id,name',
            'items.shopAttribute',
            'items.shopAttribute.attributeType.attributeCategory:id,name',
            'items.shopAttribute.attributeType:id',
            'tailoringShop:id,shop_name,contact_number,address,contact_person',
        ]);

        return ['data' => $order];
    }

    public function store(Request $request, TailoringShop $shop)
    {
        if (! $this->authorizeShop($request, $shop)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $valid = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'service_id' => 'required|exists:services,id',
            'attributes' => 'nullable|array',
            'attributes.*' => 'integer|exists:shop_attributes,id',
            'status' => ['nullable', Rule::enum(OrderStatus::class)],
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
            foreach ($valid['attributes'] as $attributeId) {
                $shopAttr = DB::table('shop_attributes')->where('id', $attributeId)->first();
                if ($shopAttr) {
                    $totalPrice += (float) $shopAttr->price;
                    $attributesData[] = [
                        'shop_attribute_id' => $shopAttr->id,
                        'price' => (float) $shopAttr->price,
                    ];
                }
            }
        }

        $orderData = [
            'tailoring_shop_id' => $shop->id,
            'customer_id' => $valid['customer_id'],
            'order_status_id' => OrderStatusLookup::idByName($valid['status'] ?? OrderStatus::REQUESTED->value),
            'expected_completion_date' => $valid['expected_completion_date'] ?? null,
            'notes' => $valid['notes'] ?? null,
        ];

        $order = Order::create($orderData);

        // Create order items
        foreach ($attributesData as $attrData) {
            OrderItem::create([
                'order_id' => $order->id,
                'shop_attribute_id' => $attrData['shop_attribute_id'],
                'price' => $attrData['price'],
                'quantity' => 1,
            ]);
        }

        // Attach main service as order service
        OrderService::create([
            'order_id' => $order->id,
            'service_id' => $valid['service_id'],
            'price' => $service->price,
            'quantity' => 1,
        ]);

        $order->load(['customer:id,name,phone_number', 'orderServices.service:id,service_name,price', 'items.shopAttribute.attributeType']);

        return redirect()->back()->with('message', 'Order created successfully!');
    }

    public function publicStore(Request $request, TailoringShop $shop)
    {
        // 1. Validation (Note: customer_id is NOT required here because it's the auth user)
        $valid = $request->validate([
            'service_id' => ['required', Rule::exists('services', 'id')->where('tailoring_shop_id', $shop->id)],
            'material_source' => 'required|in:customer,shop,tailor_choice',
            'is_rush' => 'nullable|boolean',
            'design_image' => 'nullable|image|mimes:jpeg,png,jpg,webp,gif|max:5120',
            'measurement_type' => 'nullable|string',
            'measurement_preference' => 'nullable|string',
            'measurement_date' => 'nullable|date_format:Y-m-d H:i:s',
            'measurement_time' => 'nullable|date_format:H:i',
            'material_dropoff_date' => 'nullable|date',
            'material_dropoff_time' => 'nullable|date_format:H:i',
            'date' => 'nullable|date',
            'time_start' => 'nullable|date_format:H:i',
            'attributes' => 'nullable|array',
            'attributes.*' => 'integer|exists:shop_attributes,id',
            'notes' => 'nullable|string',
        ]);

        $submittedFitMethodId = $request->input('fit_method_id');
        $fitMethodId = null;
        $fitMethodName = null;

        if ($submittedFitMethodId) {
            $fitMethodId = \App\Models\FitMethod::whereKey($submittedFitMethodId)->value('id');
            $fitMethodName = \App\Models\FitMethod::whereKey($fitMethodId)->value('name');
        }

        if (! $fitMethodId) {
            $measurementType = $request->input('measurement_type') ?? $request->input('measurement_preference');
            $fitMethodName = match (strtolower((string) $measurementType)) {
                'profile', 'self_measured', 'self_measure' => 'Self-Measured',
                'scheduled', 'workshop_fitting', 'in_shop' => 'In-Shop Fitting',
                'home_visit' => 'Home Visit',
                default => 'No Measurement Required',
            };
            $fitMethodId = \App\Models\FitMethod::where('name', $fitMethodName)->value('id');
        }

        // Handle design_image upload
        if ($request->hasFile('design_image')) {
            $imagePath = $request->file('design_image')->store('orders/images', 'public');
            $valid['design_image'] = $imagePath;
        }

        $service = $shop->services()->findOrFail($valid['service_id']);
        $isRush = (bool) ($valid['is_rush'] ?? false);

        if ($isRush && ! (bool) ($service->rush_service_available ?? false)) {
            return response()->json([
                'message' => 'Rush ordering is not available for this service.',
            ], 422);
        }

        // 2. Calculate Total Price
        $totalPrice = $service->price;
        $attributesData = [];

        if (!empty($valid['attributes'])) {
            foreach ($valid['attributes'] as $attributeId) {
                $shopAttr = DB::table('shop_attributes')->where('id', $attributeId)->first();
                if ($shopAttr) {
                    $qty = (float) $request->input("attribute_quantities.{$attributeId}", 1);
                    $totalPrice += (float) $shopAttr->price * $qty;
                    $attributesData[] = [
                        'shop_attribute_id' => $shopAttr->id,
                        'price' => (float) $shopAttr->price,
                    ];
                }
            }
        }

        // 3. Extract scheduling data and create everything in a concurrency-safe transaction.
        $measurementDate = null;
        $measurementTime = $valid['measurement_time'] ?? null;

        if (!empty($valid['measurement_date'])) {
            $measurementDate = Carbon::parse($valid['measurement_date'])->format('Y-m-d');
            if (!$measurementTime) {
                $measurementTime = Carbon::parse($valid['measurement_date'])->format('H:i');
            }
        } elseif (!empty($valid['date']) && $fitMethodName === 'In-Shop Fitting') {
            $measurementDate = Carbon::parse($valid['date'])->format('Y-m-d');
            $measurementTime = $measurementTime ?: ($valid['time_start'] ?? null);
        }

        $materialDropoffDate = !empty($valid['material_dropoff_date'])
            ? Carbon::parse($valid['material_dropoff_date'])->format('Y-m-d')
            : null;
        $materialDropoffTime = $valid['material_dropoff_time'] ?? null;

        if (!$materialDropoffDate && !empty($valid['date']) && ($valid['material_source'] ?? null) === 'customer') {
            $materialDropoffDate = Carbon::parse($valid['date'])->format('Y-m-d');
            $materialDropoffTime = $materialDropoffTime ?: ($valid['time_start'] ?? null);
        }

        $slotDurationMinutes = (int) ($shop->slot_duration_minutes ?: 30);
        $maxBookingsPerSlot = (int) ($shop->max_bookings_per_slot ?: 1);
        $maxUserBookingsPerSlot = (int) ($shop->max_user_bookings_per_slot ?: 3);
        $user = Auth::user();

        $createdOrderId = null;

        try {
            DB::transaction(function () use (
                $request,
                $shop,
                $valid,
                $service,
                $isRush,
                $fitMethodId,
                $measurementDate,
                $measurementTime,
                $materialDropoffDate,
                $materialDropoffTime,
                $slotDurationMinutes,
                $maxBookingsPerSlot,
                $maxUserBookingsPerSlot,
                $totalPrice,
                $user,
                &$createdOrderId
            ) {
                $orderData = [
                    'tailoring_shop_id' => $shop->id,
                    'user_id' => $user->id,
                    'user_id' => $user->id,
                    'fit_method_id' => $fitMethodId,
                    'material_source' => $valid['material_source'],
                    'design_image' => $valid['design_image'] ?? null,
                    'order_status_id' => OrderStatusLookup::idByName(OrderStatus::REQUESTED->value),
                    // total_price moved to order_services
                    'notes' => $valid['notes'] ?? null,
                    'is_rush' => $isRush,
                    'rush_fee' => 0,
                ];

                $order = Order::create($orderData);
                $createdOrderId = $order->id;

                if (!empty($valid['attributes'])) {
                    foreach ($valid['attributes'] as $attributeId) {
                        $shopAttr = DB::table('shop_attributes')->where('id', $attributeId)->first();
                        if ($shopAttr) {
                            $qty = (float) $request->input("attribute_quantities.{$attributeId}", 1);
                            $order->items()->create([
                                'shop_attribute_id' => $shopAttr->id,
                                'price' => (float) $shopAttr->price,
                                'quantity' => $qty,
                            ]);
                        }
                    }
                }

                // Attach the main service as an order service
                OrderService::create([
                    'order_id' => $order->id,
                    'service_id' => $valid['service_id'],
                    'price' => $service->price,
                    'quantity' => 1,
                ]);

                $bookAppointment = function (string $date, string $time, string $type) use ($shop, $user, $order, $slotDurationMinutes, $maxBookingsPerSlot, $maxUserBookingsPerSlot) {
                    $normalizedTime = Carbon::createFromFormat('H:i', $time)->format('H:i:s');

                    $userSlotBookingCount = Appointment::where('shop_id', $shop->id)
                        ->where('user_id', $user->id)
                        ->whereDate('date', $date)
                        ->where('time_start', $normalizedTime)
                        ->lockForUpdate()
                        ->count();

                    if ($userSlotBookingCount >= $maxUserBookingsPerSlot) {
                        throw new \Exception("You have reached the maximum limit of {$maxUserBookingsPerSlot} bookings for this specific time slot to prevent system abuse.");
                    }

                    $bookedCount = Appointment::where('shop_id', $shop->id)
                        ->where('date', $date)
                        ->where('time_start', $normalizedTime)
                        ->lockForUpdate()
                        ->count();

                    if ($bookedCount >= $maxBookingsPerSlot) {
                        throw new \Exception("Sorry, the {$type} time slot at {$time} was just taken by another customer. Please select a different time.");
                    }

                    $slotStart = Carbon::parse("{$date} {$normalizedTime}");

                    $appointmentData = [
                        'shop_id' => $shop->id,
                        'user_id' => $user->id,
                        'order_id' => $order->id,
                        'date' => $date,
                        'time_start' => $slotStart->format('H:i:s'),
                        'time_end' => $slotStart->copy()->addMinutes($slotDurationMinutes)->format('H:i:s'),
                        'status' => 'confirmed',
                        'type' => $type,
                    ];

                    Appointment::create($appointmentData);
                };

                if (!empty($measurementDate) && !empty($measurementTime)) {
                    $bookAppointment($measurementDate, $measurementTime, 'fitting');
                }

                if (!empty($materialDropoffDate) && !empty($materialDropoffTime)) {
                    $bookAppointment($materialDropoffDate, $materialDropoffTime, 'drop-off');
                }
            });
        } catch (\Exception $e) {
            $rawMessage = $e->getMessage();
            if (str_contains($rawMessage, 'appointments_shop_id_date_time_start_user_id_unique')) {
                return back()->withErrors([
                    'booking' => 'You have reached the maximum booking limit for this specific time slot. Please choose another time.'
                ]);
            }

            return back()->withErrors(['booking' => $rawMessage]);
        }

        // 5. Redirect back for Inertia
        $latestOrder = $createdOrderId ? Order::find($createdOrderId) : null;

        if ($latestOrder && $shop->user) {
            $recentShopNotification = DB::table('notifications')
                ->where('notifiable_id', $shop->user->id)
                ->where('notifiable_type', \App\Models\User::class)
                ->where('data->type', 'new_order_received')
                ->where('data->order_id', $latestOrder->id)
                ->where('created_at', '>=', now()->subMinutes(5))
                ->whereNull('read_at')
                ->exists();

            if (! $recentShopNotification) {
                $shop->user->notify(new NewOrderReceivedNotification($latestOrder));
            }
        }

        if ($latestOrder) {
            $this->logOrderActivity(
                $latestOrder,
                $user?->id,
                'order_created',
                'Customer placed order #' . $latestOrder->id . '.'
            );
        }

        return redirect()->back()->with('message', 'Order placed successfully!');
    }

    public function update(Request $request, TailoringShop $shop, Order $order)
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
            'attributes.*.pivot_id' => 'required|integer|exists:shop_attributes,id',
            'attributes.*.qty' => 'required|numeric|min:0.01',
            'status' => ['nullable', Rule::enum(OrderStatus::class)],
            'expected_completion_date' => ['nullable', 'date', 'after_or_equal:today', 'required_if:status,Quoted'],
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

            foreach ($valid['attributes'] as $attrData) {
                // Query the pivot table directly to ensure we get the correct master ID
                $pivotItem = DB::table('shop_attributes')
                    ->where('id', $attrData['pivot_id'])
                    ->first();

                if ($pivotItem) {
                    $unitPrice = (float) $pivotItem->price;
                    $lineTotal = $unitPrice * (float) $attrData['qty'];
                    $totalPrice += $lineTotal;

                    $attributesData[] = [
                        'shop_attribute_id' => $pivotItem->id,
                        'price' => $unitPrice,
                        'quantity' => (float) $attrData['qty'],
                    ];
                }
            }

            // Delete existing order items and create new ones
            $order->items()->delete();
            foreach ($attributesData as $itemData) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'shop_attribute_id' => $itemData['shop_attribute_id'],
                    'price' => $itemData['price'],
                    'quantity' => $itemData['quantity'],
                ]);
            }

            // Update total price if not manually set
            if (!isset($valid['total_price'])) {
                $valid['total_price'] = $totalPrice;
            }
        }

        $order->update($valid);
        
        // Force refresh of the total amount in the order record
        $order->total_amount = $valid['total_price'] ?? $order->total_amount;
        $order->save();

        if ($order->user) {
            $statusLabel = $order->status instanceof \App\Enums\OrderStatus
                ? $order->status->value
                : (string) $order->status;

            // Anti-spam throttle: Check for duplicate notifications within 5 minutes
            $recentNotification = DB::table('notifications')
                ->where('data->type', 'status_updated')
                ->where('data->order_id', $order->id)
                ->where('created_at', '>=', now()->subMinutes(5))
                ->whereNull('read_at')
                ->exists();

            if (!$recentNotification) {
                $order->user->notify(new OrderUpdatedNotification(
                    $order,
                    "Your order #{$order->id} was updated by the shop. Current status: {$statusLabel}.",
                    'status_updated'
                ));
            }
        }

        // CRITICAL: Return a redirect back so Inertia refreshes the Modal props
        return redirect()->back()->with('message', 'Invoice updated successfully!');
    }

    public function uploadPhoto(Request $request, Order $order)
    {
        $user = $request->user();
        $shop = $order->tailoringShop;

        if (!$shop || $user->tailoringShops()->where('id', $shop->id)->doesntExist()) {
            abort(403, 'Unauthorized. Can only upload photos for your shop.');
        }

        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,webp,gif|max:5120',
            'caption' => 'nullable|string|max:255',
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('order_photos', 'public');

            $order->images()->create([
                'image_path' => $path,
                'caption' => $request->caption,
            ]);

            // Photos are now optional gallery entries only.

            if ($order->user) {
                // Anti-spam throttle: Check for duplicate photo notifications within 5 minutes
                $recentNotification = DB::table('notifications')
                    ->where('data->type', 'photo_uploaded')
                    ->where('data->order_id', $order->id)
                    ->where('created_at', '>=', now()->subMinutes(5))
                    ->whereNull('read_at')
                    ->exists();

                if (!$recentNotification) {
                    $order->user->notify(new OrderUpdatedNotification(
                        $order,
                        'New progress photo uploaded for Order #' . $order->id,
                        'photo_uploaded'
                    ));
                }
            }

            return redirect()->back()->with('success', 'Photo uploaded and order updated.');
        }

        return redirect()->back()->with('error', 'No image provided.');
    }

    public function showWeb(Request $request, Order $order)
    {
        $shop = $order->tailoringShop;
        if (!$shop || !$request->user()->tailoringShops()->where('tailoring_shops.id', $shop->id)->exists()) {
            abort(403, 'Unauthorized.');
        }

        // Load the order relationships
        $order->load([
            'customer.profile',
            'customer:id,name,email',
            'service:id,service_name,price,service_description,checkout_type',
            'service.serviceCategory:id,name',
            'fitMethod',
            'appointments',
            'items.shopAttribute.attributeType.attributeCategory',
            'images',
            'order_measurements',
            'reworkRequest',
            'logs.user:id,name,role'
        ]);

        // Explicitly load the shop attributes with pivot data AND relationships
        $shop->load([
            'attributes' => function ($query) {
                $query->withPivot('price', 'item_name', 'image_url', 'notes', 'unit');
            },
            'attributes.attributeCategory',
        ]);

        $categories = AttributeCategory::orderBy('name')->get(['id', 'name']);

        // Fetch the customer's global measurements for auto-fill
        $customerId = $order->user_id ?? $order->customer_id;
        $globalMeasurements = [];
        
        if ($customerId) {
            try {
                $globalMeasurements = UserMeasurement::where('user_id', $customerId)
                    ->get(['measurement_name', 'value', 'unit', 'last_verified_at'])
                    ->mapWithKeys(fn($m) => [
                        $m->measurement_name => [
                            'value' => $m->value,
                            'unit' => $m->unit,
                            'lastVerified' => $m->last_verified_at,
                        ]
                    ])
                    ->toArray();
            } catch (\Exception $e) {
                // Silently fail and return empty measurements if table doesn't exist or query fails
                // This ensures the order view still loads properly
                $globalMeasurements = [];
                Log::warning('Failed to fetch global measurements', [
                    'user_id' => $customerId,
                    'error' => $e->getMessage()
                ]);
            }
        }

        return \Inertia\Inertia::render('dashboard/TailorOrderWorkspace', [
            'order' => $order,
            'shop' => $shop,
            'categories' => $categories,
            'globalMeasurements' => $globalMeasurements,
        ]);
    }

    public function destroy(Request $request, TailoringShop $shop, Order $order)
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

        return redirect()->back()->with('message', 'Order deleted!');
    }

    public function updateStatus(Request $request, Order $order)
    {
        $user = $request->user();

        $hasAccess = $user->tailoringShops()
            ->where('tailoring_shops.id', $order->tailoring_shop_id)
            ->exists();

        if (!$hasAccess) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(array_column(OrderStatus::cases(), 'value'))],
            'expected_completion_date' => 'nullable|date',
        ]);

        $order->fill($validated);

        if ($request->status === 'In Progress' && !$order->production_started_at) {
            $order->production_started_at = now();
            if ($order->production_max_days) {
                $order->expected_completion_date = $this->calculateShopDeadline(
                    $order->tailoring_shop_id,
                    now(),
                    $order->production_max_days
                );
            }
        }

        $order->save();

        $this->logOrderActivity(
            $order,
            $user?->id,
            'status_updated',
            'Tailor updated order status to ' . ($validated['status'] ?? $order->status) . '.'
        );

        // Notify customer if order moved to Ready for Pickup
        $newStatus = $order->status instanceof \App\Enums\OrderStatus ? $order->status->value : (string) $order->status;
        if ($newStatus === 'Ready for Pickup' && $order->user) {
            $order->user->notify(new \App\Notifications\OrderUpdateNotification($order, 'ready_for_pickup'));
        }

        return back()->with('success', 'Order updated successfully.');
    }

    public function markMaterialsReceived(Request $request, Order $order)
    {
        $this->authorizeShopForOrder($request, $order);

        $order->update(['materials_received' => true]);
        $this->checkReadyForProduction($order);
        $this->logOrderActivity($order, $request->user()?->id, 'materials_received', 'Tailor marked customer materials as received.');

        return back()->with('success', 'Materials marked as received.');
    }

    public function markMeasurementsTaken(Request $request, Order $order)
    {
        $this->authorizeShopForOrder($request, $order);

        $order->update(['measurements_taken' => true]);
        $this->checkReadyForProduction($order);
        $this->logOrderActivity($order, $request->user()?->id, 'measurements_taken', 'Tailor marked in-shop measurements as taken.');

        return back()->with('success', 'Measurements marked as taken.');
    }

    public function updatePaymentStatus(Request $request, Order $order)
    {
        $this->authorizeShopForOrder($request, $order);

        $validated = $request->validate([
            'payment_status' => ['required', Rule::in(['Partial', 'Paid'])],
        ]);

        Payment::updateOrCreate(
            ['order_id' => $order->id],
            [
                'payment_status' => $validated['payment_status'],
                'amount' => $validated['payment_status'] === 'Paid'
                    ? (float) $order->total_amount
                    : ((float) $order->total_amount / 2),
            ]
        );

        $this->checkReadyForProduction($order);
        $this->logOrderActivity(
            $order,
            $request->user()?->id,
            'payment_status_updated',
            'Tailor updated payment status to ' . $validated['payment_status'] . '.'
        );

        return back()->with('success', 'Payment status updated successfully.');
    }

    private function authorizeShopForOrder(Request $request, Order $order): void
    {
        $shop = $order->tailoringShop;

        if (! $shop || ! $this->authorizeShop($request, $shop)) {
            abort(403, 'Forbidden.');
        }
    }

    private function checkReadyForProduction(Order $order): void
    {
        $currentStatus = $order->status instanceof OrderStatus
            ? $order->status->value
            : (string) $order->status;

        if ($currentStatus !== 'Confirmed') {
            return;
        }

        $needsMaterials = $order->material_source === 'customer';
        $fitMethodName = $order->fitMethod?->name ?? $order->fit_method?->name ?? 'No Measurement Required';
        $needsMeasurements = $fitMethodName === 'In-Shop Fitting';

        $logisticsMet = (! $needsMaterials || $order->materials_received)
            && (! $needsMeasurements || $order->measurements_taken);

        // Production unlocks if payment is 'Partial' OR 'Paid' (not restricted to full payment only)
        $paymentMet = in_array($order->payment_status, ['Partial', 'Paid'], true);

        if ($logisticsMet && $paymentMet) {
            // Mark the order as ready for production — do NOT auto-start production.
            $order->update([
                'order_status_id' => OrderStatusLookup::idByName('Ready for Production')
                    ?? OrderStatusLookup::idByName('In Progress'),
            ]);

            $order->loadMissing(['user', 'tailoringShop', 'customer']);

            $order->user?->notify(new OrderUpdatedNotification(
                $order,
                'Your order is verified and ready for production.',
                'ready_for_production'
            ));
        }
    }

    /**
     * Tailor accepts a requested order to begin quoting.
     * PATCH /store/orders/{order}/accept
     */
    public function acceptOrder(Request $request, Order $order)
    {
        $user = $request->user();
        
        // Ensure the user owns the shop for this order
        if ($order->tailoringShop->user_id !== $user->id) {
            abort(403, 'Unauthorized action.');
        }

        // Safely get the string value whether it's an Enum object or a raw string
        $currentStatus = $order->status instanceof \App\Enums\OrderStatus ? $order->status->value : $order->status;

        if ($currentStatus !== 'Requested') {
            abort(422, 'Only requested orders can be accepted. Current DB status is: ' . $currentStatus);
        }

        // Change status to Quoted using the Enum
        $order->update([
            'order_status_id' => OrderStatusLookup::idByName(\App\Enums\OrderStatus::QUOTED->value),
        ]);
        $this->logOrderActivity($order, $user?->id, 'order_accepted', 'Tailor accepted the order for quotation.');

        return redirect()->back()->with('message', 'Order Accepted! You can now prepare the quote.');
    }

    /**
     * Tailor rejects a requested order.
     * PATCH /store/orders/{order}/reject
     */
    public function rejectOrder(Request $request, Order $order)
    {
        $user = $request->user();
        
        if ($order->tailoringShop->user_id !== $user->id) {
            abort(403, 'Unauthorized action.');
        }

        $currentStatus = $order->status instanceof \App\Enums\OrderStatus ? $order->status->value : $order->status;

        if ($currentStatus !== 'Requested') {
            abort(422, 'Only requested orders can be rejected. Current status: ' . $currentStatus);
        }

        $validated = $request->validate([
            'reason' => 'required|string|max:1000'
        ]);

        // Change status to Rejected and prepend rejection reason to notes
        $currentNotes = $order->notes ?? '';
        $order->update([
            'order_status_id' => OrderStatusLookup::idByName(\App\Enums\OrderStatus::REJECTED->value),
            'notes' => $currentNotes ? "REJECTED BY SHOP: {$validated['reason']}\n\n{$currentNotes}" : "REJECTED BY SHOP: {$validated['reason']}"
        ]);

        $this->logOrderActivity(
            $order,
            $user?->id,
            'order_rejected',
            'Tailor rejected the order. Reason: ' . $validated['reason']
        );

        if ($order->user) {
            $order->user->notify(new OrderUpdatedNotification(
                $order,
                'Your order #' . $order->id . ' was rejected by the shop.',
                'order_rejected',
                $validated['reason'],
                'Shop'
            ));
        }

        return redirect()->back()->with('message', 'Order has been rejected.');
    }

    /**
     * Tailor submits the final quote and required materials.
     * PATCH /store/orders/{order}/quote
     */
    public function quote(Request $request, Order $order)
    {
        $user = $request->user();
        
        // Ensure the user owns the shop for this order
        if ($order->tailoringShop->user_id !== $user->id) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'base_labor' => 'required|numeric|min:0',
            'rush_fee' => 'nullable|numeric|min:0',
            'production_min_days' => ['required', 'integer', 'min:1'],
            'production_max_days' => ['required', 'integer', 'gte:production_min_days'],
            'required_materials' => 'nullable|array',
            'requested_measurements' => 'nullable|array',
            'measurement_unit' => 'nullable|string|in:inches,cm',
            'status' => ['required', \Illuminate\Validation\Rule::enum(\App\Enums\OrderStatus::class)],
        ]);

        // Prepare the updated data
        $updateData = [
            'order_status_id' => OrderStatusLookup::idByName($validated['status']),
            'production_min_days' => $validated['production_min_days'],
            'production_max_days' => $validated['production_max_days'],
            'required_materials' => $validated['required_materials'] ?? [],
        ];

        $rushFee = $order->is_rush ? (float) ($validated['rush_fee'] ?? $order->rush_fee ?? 0) : 0;
        $updateData['rush_fee'] = $rushFee;

        // If the shop provides the materials, we need to add the tailor's material costs to the total
        if ($order->material_source === 'shop' && !empty($validated['required_materials'])) {
            $tailorMaterialsCost = collect($validated['required_materials'])->reduce(function ($sum, $mat) {
                return $sum + ((float)($mat['price'] ?? 0) * (float)($mat['quantity'] ?? 1));
            }, 0);
            
            // Get the existing customer items total
            $customerItemsCost = $order->items->reduce(function ($sum, $item) {
                $price = $item->price ?? $item->pivot->price ?? 0;
                $qty = $item->quantity ?? $item->pivot->quantity ?? 1;
                return $sum + ($price * $qty);
            }, 0);

            // New Grand Total: Labor + Tailor Materials + Customer Items
            $updateData['total_amount'] = (float)$validated['base_labor'] + $tailorMaterialsCost + $customerItemsCost + $rushFee;
        } else {
            // If customer provides materials, total is just labor (+ existing shop items)
            $customerItemsCost = $order->items->reduce(function ($sum, $item) {
                $price = $item->price ?? $item->pivot->price ?? 0;
                $qty = $item->quantity ?? $item->pivot->quantity ?? 1;
                return $sum + ($price * $qty);
            }, 0);
            
            $updateData['total_amount'] = (float)$validated['base_labor'] + $customerItemsCost + $rushFee;
        }

        $order->update($updateData);

        // Update the specific labor price for this order
        $orderService = \App\Models\OrderService::where('order_id', $order->id)->first();
        if ($orderService) {
            $orderService->update(['price' => $validated['base_labor']]);
        }

        if (!empty($validated['requested_measurements'])) {
            $this->logOrderActivity(
                $order,
                $user?->id,
                'measurements_requested',
                'Tailor requested specific measurements from the customer before confirmation.'
            );
        }

        $this->logOrderActivity(
            $order,
            $user?->id,
            'quote_submitted',
            'Tailor submitted quote for order #' . $order->id . '. Total: ₱' . number_format((float) $updateData['total_amount'], 2)
        );

        // Notify the customer that quote has been sent
        if ($order->user) {
            // Anti-spam throttle: Check for duplicate notifications within 5 minutes
            $recentNotification = DB::table('notifications')
                ->where('data->type', 'quote_sent')
                ->where('data->order_id', $order->id)
                ->where('created_at', '>=', now()->subMinutes(5))
                ->whereNull('read_at')
                ->exists();

                if (!$recentNotification) {
                    $order->user->notify(new OrderUpdateNotification(
                        $order,
                        'quote_sent'
                    ));
                }
        }

        return redirect()->back()->with('message', 'Quote and requirements sent successfully!');
    }
}
