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
            'service_name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'duration_days' => 'nullable|integer|min:0',
        ]);

        Service::create([
            'tailoring_shop_id' => $shop->id,
            'service_name' => $request->service_name,
            'price' => $request->price,
            'duration_days' => $request->duration_days ?? 0,
        ]);

        return redirect()->back();
    }

    public function updateServices(Request $request, $id)
    {
        $shop = TailoringShop::where('user_id', Auth::id())->firstOrFail();
        
        $request->validate([
            'service_name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'duration_days' => 'nullable|integer|min:0',
        ]);

        $service = Service::where('id', $id)
            ->where('tailoring_shop_id', $shop->id)
            ->firstOrFail();

        $service->update([
            'service_name' => $request->service_name,
            'price' => $request->price,
            'duration_days' => $request->duration_days ?? 0,
        ]);

        return redirect()->back();
    }

    public function deleteServices($id)
    {
        $shop = TailoringShop::where('user_id', Auth::id())->firstOrFail();

        $service = Service::where('id', $id)
            ->where('tailoring_shop_id', $shop->id)
            ->firstOrFail();

        $service->delete();

        return redirect()->back();
    }
    public function addAttribute(Request $request)
    {
        $userId = Auth::id();

        $shop = \App\Models\TailoringShop::where('user_id', $userId)->firstOrFail();
        $request->validate([
            'attribute_id' => 'required|exists:attributes,id',
            'price' => 'required|numeric|min:0',
            'unit' => 'required|string|max:255',
        ]);

        $shop->attributes()->syncWithoutDetaching([
            $request->attribute_id => [
                'price' => $request->price,
                'unit' => $request->unit,
                'is_available' => true,
                ]
        ]);
        return redirect()->back()->with('message', 'Material added/updated to the shop!');
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
