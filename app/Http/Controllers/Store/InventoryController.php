<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\TailoringShop;
use App\Models\AttributeCategory;
use App\Models\ServiceCategory;
use App\Models\AttributeType;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class InventoryController extends Controller
{
    public function servicesIndex()
    {
        $shop = TailoringShop::where('user_id', Auth::id())->firstOrFail();
        return Inertia::render('StoreAdmin/ServicesPage', [
            'shop' => $shop,
            'services' => Service::where('tailoring_shop_id', $shop->id)->get(),
            'serviceCategories' => ServiceCategory::orderBy('name')->get(),
        ]);
    }

    public function index()
    {
        $shop = TailoringShop::where('user_id', Auth::id())->firstOrFail();
        return Inertia::render('StoreAdmin/Inventory', [
            'shop' => $shop,
            // Get categories and their possible attributes (Linen, Cotton, etc.)
            'categories' => AttributeCategory::with('attributeTypes')->get(),
            'attributeTypes' => AttributeType::all(),
            // Get what this shop currently has in stock
            'shopAttributes' => $shop->attributes()->orderByPivot('created_at', 'desc')->get(),
        ]);
    }

    public function addServices(Request $request)
    {
        $shop = TailoringShop::where('user_id', Auth::id())->firstOrFail();
        
        $request->validate([
            'service_category_id' => 'required|exists:service_categories,id',
            'service_name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'duration_days' => 'nullable|integer|min:0',
            'service_description' => 'nullable|string',
            'is_available' => 'boolean',
            'rush_service_available' => 'boolean',
            'appointment_required' => 'boolean',
            'notes' => 'nullable|string',
            'checkout_type' => 'required|string|in:fixed_price,requires_quote',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp,gif|max:2048',
        ]);
            
        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('services', 'public');
        }

        // Store the service_category_id as service_category value
        Service::create([
            'tailoring_shop_id' => $shop->id,
            'service_category_id' => (int) $request->service_category_id,
            'service_name' => $request->service_name,
            'price' => (float) $request->price,
            'image' => $imagePath,
            'duration_days' => $request->duration_days !== null ? (int) $request->duration_days : 0,
            'service_description' => $request->service_description ?? '',
            'is_available' => $request->boolean('is_available', true),
            'rush_service_available' => $request->boolean('rush_service_available', false),
            'appointment_required' => $request->boolean('appointment_required', false),
            'notes' => $request->notes ?? '',
            'checkout_type' => $request->checkout_type ?? 'requires_quote',
        ]);

        return redirect()->back()->with('message', 'Service added successfully!');
    }

    public function updateServices(Request $request, $id)
    {
        $shop = TailoringShop::where('user_id', Auth::id())->firstOrFail();
        
$request->validate([
            'service_category_id' => 'required|exists:service_categories,id',
            'service_name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'duration_days' => 'nullable|integer|min:0',
            'service_description' => 'nullable|string',
            'is_available' => 'boolean',
            'rush_service_available' => 'boolean',
            'appointment_required' => 'boolean',
            'notes' => 'nullable|string',
            'checkout_type' => 'sometimes|string|in:fixed_price,requires_quote',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp,gif|max:2048',
        ]);

        $service = Service::where('id', $id)
            ->where('tailoring_shop_id', $shop->id)
            ->firstOrFail();

        if ($request->hasFile('image')) {
            if ($service->image) {
                Storage::disk('public')->delete($service->image);
            }
            $imagePath = $request->file('image')->store('services', 'public');
            $service->image = $imagePath;
            $service->save();
        }

        // Store the service_category_id as service_category value
        $service->update([
            'service_category_id' => $request->service_category_id ?? '',
            'service_name' => $request->service_name ?? '',
            'price' => $request->price ?? '',
            'duration_days' => $request->duration_days ?? '',
            'service_description' => $request->service_description ?? '',
            'is_available' => $request->boolean('is_available', true),
            'rush_service_available' => $request->boolean('rush_service_available', false),
            'appointment_required' => $request->boolean('appointment_required', false),
            'notes' => $request->notes ?? '',
            'checkout_type' => $request->checkout_type ?? $service->checkout_type,
        ]);
        
        return redirect()->back()->with('message', 'Service updated successfully!');
    }

    public function deleteServices($id)
    {
        $shop = TailoringShop::where('user_id', Auth::id())->firstOrFail();

        $service = Service::where('id', $id)
            ->where('tailoring_shop_id', $shop->id)
            ->firstOrFail();

        $service->delete();

        return redirect()->back()->with('message', 'Service deleted successfully!');
    }

    public function storeMasterAttribute(Request $request)
    {
        $request->validate([
            'attribute_type_id' => 'required|exists:attribute_types,id',
            'item_name' => 'nullable|string|max:255',
            'price' => 'required|numeric|min:0',
            'unit' => 'required|string|max:255',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp,gif|max:2048',
        ]);
        $shop = TailoringShop::where('user_id', Auth::id())->firstOrFail();
        
        // Add to shop inventory with item_name
        $image_url = null;
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('materials', 'public');
            $image_url = $path;
        }

        $shop->attributes()->attach($request->attribute_type_id, [
            'item_name' => $request->item_name ?? '',
            'price' => $request->price,
            'unit' => $request->unit,
            'notes' => $request->notes ?? '',
            'is_available' => true,
            'image_url' => $image_url,
        ]);
            
        return redirect()->back()->with('message', 'New attribute added to your inventory!');
    }

    public function storeCategory(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:attribute_categories,name',
        ]);

        AttributeCategory::create([
            'name' => $request->name,
            'slug' => \Illuminate\Support\Str::slug($request->name),
        ]);

        return redirect()->back()->with('message', 'New category added to the system!');
    }

    public function updateShopAttribute(Request $request, $pivotId)
    {
        $shop = TailoringShop::where('user_id', Auth::id())->firstOrFail();
        
        $request->validate([
            'price' => 'required|numeric|min:0',
            'unit' => 'required|string|max:255',
            'item_name' => 'nullable|string|max:255',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp,gif|max:2048',
        ]);

        $image_url = null;
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('materials', 'public');
            $image_url = $path;
        }

        // Build the update array
        $updateData = [
            'price' => $request->price,
            'unit' => $request->unit,
            'item_name' => $request->item_name ?? '',
            'notes' => $request->notes ?? '',
            'is_available' => $request->boolean('is_available', true),
        ];
        
        // Only update image if a new one was provided
        if ($image_url) {
            $updateData['image_url'] = $image_url;
        }

        // Instead of updateExistingPivot (which updates all matching attribute_type_ids),
        // we directly update the specific pivot table row using the unique $pivotId.
        DB::table('shop_attributes')
            ->where('id', $pivotId)
            ->where('tailoring_shop_id', $shop->id)
            ->update($updateData);

        return redirect()->back()->with('message', 'Attribute updated successfully!');
    }

    public function deleteShopAttribute($id)
    {
        $shop = TailoringShop::where('user_id', Auth::id())->firstOrFail();
        
        // Detach the attribute from the shop
        $shop->attributes()->detach($id);

        return redirect()->back()->with('message', 'Attribute removed from shop!');
    }
    
}
