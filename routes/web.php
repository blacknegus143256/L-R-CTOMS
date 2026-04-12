<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\SuperAdmin\DashboardController;
use App\Http\Controllers\SuperAdmin\UserController;
use App\Http\Controllers\Store\StoreDashboardController;
use App\Http\Controllers\Store\InventoryController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\TailoringShopController;
use App\Models\TailoringShop;
use App\Models\Order;
use App\Http\Controllers\Api\Dashboard\OrderController;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\HomeController;

// For the Super Admin
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/super-admin/dashboard', [DashboardController::class, 'index'])->name('super.dashboard');
    
    Route::get('/super-admin/users', [UserController::class, 'index'])->name('super.users.index');
    Route::delete('/super-admin/users/{id}', [UserController::class, 'destroy'])->name('super.users.destroy');
    
    Route::get('/super-admin/shops', [App\Http\Controllers\SuperAdmin\ShopController::class, 'index'])->name('super.shops.index');
    
    Route::post('/super-admin/shops/{id}/approve', [DashboardController::class, 'approve'])->name('super.shops.approve');
    Route::post('/super-admin/shops/{id}/reject', [DashboardController::class, 'reject'])->name('super.shops.reject');
    Route::post('/super-admin/shops/{id}/demote', [DashboardController::class, 'demote'])->name('super.shops.demote');
});

// For the Store Admin
Route::middleware(['auth', 'verified', 'role:store_admin'])->group(function () {
    Route::get('/store/dashboard', [StoreDashboardController::class, 'index'])->name('store.dashboard');
Route::get('/store/inventory', [App\Http\Controllers\Store\InventoryController::class, 'index'])->name('store.inventory');
    Route::get('/store/services', [App\Http\Controllers\Store\InventoryController::class, 'servicesIndex'])->name('store.services');
    
    // Store Orders - redirect to orders page with shop ID
    Route::get('/store/orders', function () {
        $shop = TailoringShop::where('user_id', Auth::id())->first();
        if ($shop) {
            return Inertia::location('/store/orders/' . $shop->id);
        }
        return Inertia::location('/store/dashboard');
    })->name('store.orders');
    
    // Store Orders page with shop ID - fetch orders directly
    Route::get('/store/orders/{shopId}', function ($shopId) {
$shop = TailoringShop::with(['attributes.attributeCategory'])->findOrFail($shopId);
        
        // Get orders for this shop with related data
        $orders = Order::where('tailoring_shop_id', $shopId)
            ->with(['user.profile', 'customer', 'service.serviceCategory', 'items.attribute', 'tailoringShop'])
            ->latest()
            ->get();

        return Inertia::render('StoreAdmin/OrdersPage', [
            'shopId' => $shopId,
            'shop' => $shop,
            'orders' => $orders
        ]);
    })->name('store.orders.page');
    
    // Update order status (improved with validation & mass assignment)
    Route::patch('/store/orders/{order}/status', function (\Illuminate\Http\Request $request, $orderId) {
        $order = Order::findOrFail($orderId);
        
        $validated = $request->validate([
            'status' => 'required|string|in:Pending,Accepted,Appointment Scheduled,In Progress,Ready,Completed,Cancelled',
            'expected_completion_date' => 'nullable|date',
            'measurement_snapshot' => 'nullable|array',
        ]);
        
        $order->update($validated);
        
        return back()->with('message', 'Order status updated successfully!');
    })->name('store.orders.update-status');

    Route::patch('/api/shops/{shop}/orders/{order}', [\App\Http\Controllers\Api\Dashboard\OrderController::class, 'update'])->name('api.shops.orders.update');

    Route::post('/store/inventory', [App\Http\Controllers\Store\InventoryController::class, 'addServices'])->name('store.services.add');
    Route::put('/store/inventory/{id}', [App\Http\Controllers\Store\InventoryController::class, 'updateServices'])->name('store.services.update');
    Route::delete('/store/inventory/{id}', [App\Http\Controllers\Store\InventoryController::class, 'deleteServices'])->name('store.services.delete');
    Route::post('/store/attributes', [InventoryController::class, 'addAttribute'])->name('store.attributes.add');
    Route::put('/store/attributes/{id}', [InventoryController::class, 'updateShopAttribute'])->name('store.attributes.update');
    Route::delete('/store/attributes/{id}', [InventoryController::class, 'deleteShopAttribute'])->name('store.attributes.delete');
    Route::post('/store/master-attributes', [InventoryController::class, 'storeMasterAttribute'])->name('store.master-attributes.add');
    Route::post('/store/categories', [InventoryController::class, 'storeCategory'])->name('store.categories.add');
});

Route::get('/dashboard', function () {
    $user = Auth::user();
    
    if ($user->role === 'super_admin') {
        return redirect()->route('super.dashboard');
    }
    
    if ($user->role === 'store_admin') {
        return redirect()->route('store.dashboard');
    }

    // Process logic ONLY for regular Customers
    $orders = \App\Models\Order::where('user_id', $user->id)->get();
    
    $activeCount = $orders->whereIn('status', ['Pending', 'Accepted', 'In Progress', 'Appointment Scheduled'])->count();
    $readyCount = $orders->where('status', 'Ready')->count();
    $totalSpent = $orders->where('status', 'Completed')->sum('total_price');
    
    $recentOrders = \App\Models\Order::where('user_id', $user->id)
        ->with('tailoring_shop')
        ->latest()
        ->take(5)
        ->get();
    
    $measurements = $user->profile;
    
    $recommendedShops = \App\Models\TailoringShop::where('status', 'approved')
        ->where('is_active', true)
        ->inRandomOrder()
        ->take(3)
        ->get();
    
    return Inertia::render('Dashboard', [
        'stats' => [
            'active' => $activeCount,
            'ready' => $readyCount,
            'totalSpent' => $totalSpent,
        ],
        'recentOrders' => $recentOrders,
        'measurements' => $measurements,
        'recommendedShops' => $recommendedShops,
    ]);
})->middleware(['auth', 'verified'])->name('dashboard');

// Customer Orders - for users without shops (regular customers)
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/my-orders', function () {
        // Get orders for the current logged in user
        $orders = Order::where('user_id', Auth::id())
->with(['user.profile', 'service.serviceCategory', 'items.attribute', 'tailoringShop.attributes'])
            ->latest()
            ->get();
            
        return Inertia::render('dashboard/MyOrders', [
            'orders' => $orders
        ]);
    })->name('customer.orders');

    // Customer measurement submission
    Route::patch('/my-orders/{order}/measurements', [\App\Http\Controllers\Api\Dashboard\CustomerOrderController::class, 'updateMeasurements'])->name('customer.orders.measurements');
});

Route::get('/shop/{shop}',  function ($shop){
$shop = TailoringShop::with(['services.serviceCategory', 'attributes', 'attributes.attributeCategory', 'user.profile'])->findOrFail($shop);

    return Inertia::render('Shop', [
        'shop' => $shop
    ]);
});

Route::get('/', [HomeController::class, 'index'])->name('home');


Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    
    // Public store order
    Route::post('/shops/{shop}/orders', [OrderController::class, 'publicStore']);
});

require __DIR__.'/auth.php';

