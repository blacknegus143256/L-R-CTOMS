<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\AttributeType;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\TailoringShop;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use App\Enums\OrderStatus;

class OrderController extends Controller
{

    private function authorizeShop(Request $request, TailoringShop $shop): bool
    {
        return $request->user()->tailoringShops()->where('tailoring_shops.id', $shop->id)->exists();
    }

    public function index(Request $request, TailoringShop $shop)
    {
        if (! $this->authorizeShop($request, $shop)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $orders = $shop->orders()
            ->with(['customer:id,name,phone_number', 'service:id,service_name,price,service_category_id', 'service.serviceCategory', 'items.attribute'])
            ->latest()
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
            'customer:id,name,phone_number,email,address,measurements',
            'service:id,service_name,price,service_description,duration_days,appointment_required',
            'service.serviceCategory:id,name',
            'items.attribute',
            'items.attribute.attributeCategory:id,name',
            'items.attribute.attributeType:id',
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
                        'attribute_type_id' => $shopAttr->attribute_type_id,
                        'price' => (float) $shopAttr->price,
                    ];
                }
            }
        }

        $orderData = [
            'tailoring_shop_id' => $shop->id,
            'customer_id' => $valid['customer_id'],
            'service_id' => $valid['service_id'],
            'status' => $valid['status'] ?? OrderStatus::REQUESTED->value,
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
                'quantity' => 1,
            ]);
        }

        $order->load(['customer:id,name,phone_number', 'service:id,service_name,price', 'items.attribute']);

        return redirect()->back()->with('message', 'Order created successfully!');
    }

    public function publicStore(Request $request, TailoringShop $shop)
    {
        // 1. Validation (Note: customer_id is NOT required here because it's the auth user)
        $valid = $request->validate([
            'service_id' => ['required', Rule::exists('services', 'id')->where('tailoring_shop_id', $shop->id)],
            'style_tag' => 'nullable|string|max:255',
            'material_source' => 'required|in:customer,shop,tailor_choice',
            'design_image' => 'nullable|image|max:10240', // 10MB
            'measurement_type' => 'required|in:profile,scheduled',
            'measurement_date' => 'nullable|date_format:Y-m-d H:i:s|required_if:measurement_type,scheduled',
            'material_dropoff_date' => 'nullable|date',
            'attributes' => 'nullable|array',
            'attributes.*' => 'integer|exists:shop_attributes,id',
            'notes' => 'nullable|string',
        ]);

        // Handle design_image upload
        if ($request->hasFile('design_image')) {
            $imagePath = $request->file('design_image')->store('orders/images', 'public');
            $valid['design_image'] = $imagePath;
        }

        $service = $shop->services()->findOrFail($valid['service_id']);

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
                        'attribute_type_id' => $shopAttr->attribute_type_id,
                        'price' => (float) $shopAttr->price,
                    ];
                }
            }
        }

        // 3. Create the Order (Linking it to the logged-in user)
        $user = Auth::user();
        $orderData = [
            'tailoring_shop_id' => $shop->id,
            'user_id' => $user->id,
            'service_id' => $valid['service_id'],
            'style_tag' => $valid['style_tag'] ?? null,
            'material_source' => $valid['material_source'],
            'design_image' => $valid['design_image'] ?? null,
            'measurement_type' => $valid['measurement_type'],
            'measurement_date' => $valid['measurement_date'] ?? null,
            'material_dropoff_date' => $valid['material_dropoff_date'] ?? null,
        ];

        // Legacy snapshot removed - using new JSON measurement system
        $orderData['measurement_preference'] = $valid['measurement_preference'] ?? null;

        // Dynamic Status: Fixed Price goes straight to Confirmed, Custom goes to Requested
        $orderData['status'] = ($service->checkout_type === 'fixed_price') 
            ? OrderStatus::CONFIRMED->value 
            : OrderStatus::REQUESTED->value;
        $orderData['total_price'] = $totalPrice;
        $orderData['notes'] = $valid['notes'] ?? null;

        $order = Order::create($orderData);

        // 4. Create Order Items
        foreach ($valid['attributes'] as $index => $attributeId) {
            $shopAttr = DB::table('shop_attributes')->where('id', $attributeId)->first();
            if ($shopAttr) {
                $qty = (float) $request->input("attribute_quantities.{$attributeId}", 1);
                $order->items()->create([
                    'attribute_type_id' => $shopAttr->attribute_type_id,
                    'price' => (float) $shopAttr->price,
                    'quantity' => $qty,
                ]);
            }
        }

        // 5. Redirect back for Inertia
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
                        'attribute_type_id' => $pivotItem->attribute_type_id,
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
                    'attribute_type_id' => $itemData['attribute_type_id'],
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
        
        // Force refresh of the total price in the order record
        $order->total_price = $valid['total_price'] ?? $order->total_price;
        $order->save();

        // CRITICAL: Return a redirect back so Inertia refreshes the Modal props
        return redirect()->back()->with('message', 'Invoice updated successfully!');
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
}
