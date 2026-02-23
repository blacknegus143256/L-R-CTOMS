<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\TailoringShop;
use App\Models\AttributeCategory;
use App\Models\Attribute;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function index()
    {
        $shop = TailoringShop::where('user_id', Auth::id())->firstOrFail();

        return Inertia::render('StoreAdmin/Inventory', [
            'shop' => $shop,
            'services' => Service::where('tailoring_shop_id', $shop->id)->get(),
            // Get categories and their possible attributes (Linen, Cotton, etc.)
            'categories' => AttributeCategory::with('attributes')->get(),
            // Get what this shop currently has in stock
            'shopAttributes' => $shop->attributes()->with('attributeCategory')->get(),
        ]);
    }

    public function addServices(Request $request)
    {
        $shop = TailoringShop::where('user_id', Auth::id())->firstOrFail();
        
        $request->validate([
            'service_category' => 'required|string|max:255',
            'starting_price' => 'required|numeric|min:0',
            'turnaround_time' => 'nullable|integer|min:0',
            'service_description' => 'nullable|string',
            'is_available' => 'boolean',
            'rush_service_available' => 'boolean',
            'appointment_required' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        Service::create([
            'tailoring_shop_id' => $shop->id,
            'service_category' => $request->service_category,
            'starting_price' => $request->starting_price,
            'turnaround_time' => $request->turnaround_time ?? 0,
            'service_description' => $request->service_description ?? '',
            'is_available' => $request->boolean('is_available', true),
            'rush_service_available' => $request->boolean('rush_service_available', false),
            'appointment_required' => $request->boolean('appointment_required', false),
            'notes' => $request->notes ?? '',
        ]);

        return redirect()->back()->with('message', 'Service added successfully!');
    }

    public function updateServices(Request $request, $id)
    {
        $shop = TailoringShop::where('user_id', Auth::id())->firstOrFail();
        
        $request->validate([
            'service_category' => 'required|string|max:255',
            'starting_price' => 'required|numeric|min:0',
            'turnaround_time' => 'nullable|integer|min:0',
            'service_description' => 'nullable|string',
            'is_available' => 'boolean',
            'rush_service_available' => 'boolean',
            'appointment_required' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        $service = Service::where('id', $id)
            ->where('tailoring_shop_id', $shop->id)
            ->firstOrFail();

        $service->update([
            'service_category' => $request->service_category,
            'starting_price' => $request->starting_price,
            'turnaround_time' => $request->turnaround_time ?? 0,
            'service_description' => $request->service_description ?? '',
            'is_available' => $request->boolean('is_available', true),
            'rush_service_available' => $request->boolean('rush_service_available', false),
            'appointment_required' => $request->boolean('appointment_required', false),
            'notes' => $request->notes ?? '',
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
            'name' => 'required|string|max:255',
            'attribute_category_id' => 'required|exists:attribute_categories,id',
            'price' => 'required|numeric|min:0',
            'unit' => 'required|string|max:255',
        ]);

        $shop = TailoringShop::where('user_id', Auth::id())->firstOrFail();
        
        // Create the master attribute
        $attribute = \App\Models\Attribute::create([
            'name' => $request->name,
            'attribute_category_id' => $request->attribute_category_id,
        ]);

        // Automatically add to shop inventory
        $shop->attributes()->attach($attribute->id, [
            'price' => $request->price,
            'unit' => $request->unit,
            'notes' => $request->notes ?? '',
            'is_available' => true,
        ]);

        return redirect()->back()->with('message', 'New attribute added to your inventory!');
    }

    public function storeCategory(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:attribute_categories,name',
        ]);

        \App\Models\AttributeCategory::create([
            'name' => $request->name,
            'slug' => \Illuminate\Support\Str::slug($request->name),
        ]);

        return redirect()->back()->with('message', 'New category added to the system!');
    }

    public function updateShopAttribute(Request $request, $id)
    {
        $shop = TailoringShop::where('user_id', Auth::id())->firstOrFail();
        
        $request->validate([
            'price' => 'required|numeric|min:0',
            'unit' => 'required|string|max:255',
        ]);

        // Update the pivot table data
        $shop->attributes()->updateExistingPivot($id, [
            'price' => $request->price,
            'unit' => $request->unit,
            'notes' => $request->notes ?? '',
            'is_available' => $request->boolean('is_available', true),
        ]);

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
