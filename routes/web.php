<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\SuperAdmin\DashboardController;
use App\Http\Controllers\SuperAdmin\UserController;
use App\Http\Controllers\Store\StoreDashboardController;
use App\Http\Controllers\Store\ShopSettingsController;
use App\Http\Controllers\Store\ShopExceptionsController;
use App\Http\Controllers\Store\InventoryController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\TailoringShopController;
use App\Models\TailoringShop;
use App\Models\Order;
use App\Http\Controllers\Api\Dashboard\OrderController;
use App\Http\Controllers\NotificationController;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\SuperAdmin\ImpersonationController;
use App\Http\Controllers\SuperAdmin\LogController;
use App\Http\Controllers\SuperAdmin\PayoutController;
use App\Http\Controllers\Customer\AppointmentsController as CustomerAppointmentsController;
use App\Http\Controllers\Customer\CustomerDashboardController;
use App\Http\Controllers\ReworkController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\StoreAdmin\OnboardingController;

Route::post('/payments/webhook', [PaymentController::class, 'webhook'])->name('web.payments.webhook');

// Manual payment verification fallback for webhook failures (localhost/dev)
Route::post('/orders/{order}/verify-payment', [PaymentController::class, 'verifyPayment'])->middleware(['auth', 'verified'])->name('orders.verify-payment');
Route::post('/orders/{order}/reject-payment', [PaymentController::class, 'rejectPayment'])->middleware(['auth', 'verified'])->name('orders.reject-payment');

// For the Super Admin
Route::middleware(['auth', 'verified', 'role:super_admin'])->group(function () {
    Route::get('/super-admin/dashboard', [DashboardController::class, 'index'])->name('super.dashboard');
    
    Route::get('/super-admin/users', [UserController::class, 'index'])->name('super.users.index');
    Route::delete('/super-admin/users/{id}', [UserController::class, 'destroy'])->name('super.users.destroy');
    
    Route::get('/super-admin/shops', [App\Http\Controllers\SuperAdmin\ShopController::class, 'index'])->name('super.shops.index');
    Route::get('/super-admin/shops/{shop}/documents/{type}', [App\Http\Controllers\SuperAdmin\ShopController::class, 'document'])->name('super.shops.document');
    Route::post('/super-admin/shops/{shop}/reject', [App\Http\Controllers\SuperAdmin\ShopController::class, 'reject'])->name('super.shops.reject');
    
    Route::post('/super-admin/shops/{id}/approve', [DashboardController::class, 'approve'])->name('super.shops.approve');
    Route::post('/super-admin/shops/{id}/demote', [DashboardController::class, 'demote'])->name('super.shops.demote');

    Route::get('/admin/audit-logs', [LogController::class, 'index'])->name('super.audit-logs.index');
    Route::get('/admin/orders/{order}', [LogController::class, 'showOrder'])->name('super.orders.show');
    Route::get('/super-admin/payouts', [PayoutController::class, 'index'])->name('super.payouts.index');
    Route::post('/super-admin/payouts/{order}/release', [PayoutController::class, 'release'])->name('super.payouts.release');
    
    // Impersonation Routes
    Route::post('/super-admin/impersonate/{user}', [App\Http\Controllers\SuperAdmin\ImpersonationController::class, 'impersonate'])->name('super.impersonate');
    Route::post('/super-admin/leave-impersonation', [App\Http\Controllers\SuperAdmin\ImpersonationController::class, 'leaveImpersonation'])->name('super.leave-impersonation');
});

// For the Store Admin
Route::middleware(['auth', 'verified', 'role:store_admin'])->group(function () {
    Route::get('/store/onboarding', [OnboardingController::class, 'show'])->name('store.onboarding');
    Route::patch('/store/onboarding/profile', [OnboardingController::class, 'updateProfile'])->name('store.onboarding.profile.update');
    Route::post('/store/onboarding/submit', [OnboardingController::class, 'submit'])->name('store.onboarding.submit');
});

Route::middleware(['auth', 'verified', 'role:store_admin', 'shop.approved'])->group(function () {
    Route::get('/store/dashboard', [StoreDashboardController::class, 'index'])->name('store.dashboard');
    Route::post('/store/update-description', [StoreDashboardController::class, 'updateDescription'])->name('store.dashboard.update-description');
    Route::get('/store/inventory', [App\Http\Controllers\Store\InventoryController::class, 'index'])->name('store.inventory.index');
    Route::get('/store/services', [App\Http\Controllers\Store\InventoryController::class, 'servicesIndex'])->name('store.services.index');
    
    // Shop Settings
    Route::get('/store/settings', [ShopSettingsController::class, 'edit'])->name('store.schedule.index');
    Route::patch('/store/settings', [ShopSettingsController::class, 'update'])->name('store.settings.update');
    // Store Admin Master Calendar
    Route::get('/store/appointments', [StoreDashboardController::class, 'appointments'])->name('store.appointments');
    
    // Shop Exceptions CRUD
    Route::post('/store/exceptions', [ShopExceptionsController::class, 'store'])->name('store.exceptions.store');
    Route::patch('/store/exceptions/{exception}', [ShopExceptionsController::class, 'update'])->name('store.exceptions.update');
    Route::delete('/store/exceptions/{exception}', [ShopExceptionsController::class, 'destroy'])->name('store.exceptions.destroy');

    Route::middleware('shop.approved')->group(function () {
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
            
            if ($shop->user_id !== Auth::id()) {
                abort(403, 'Unauthorized. You can only view orders for your own shop.');
            }
            
            // Get orders for this shop with related data, prioritizing urgent/rush orders
            $orders = Order::where('tailoring_shop_id', $shopId)
                ->with([
                    'user.profile',
                    'customer',
                    'service.serviceCategory',
                    'items.attribute',
                    'tailoringShop',
                    'latestLog.user:id,name,role',
                ])
                ->orderByRaw('(is_rush = 1 OR expected_completion_date <= NOW() + INTERVAL 2 DAY) DESC')
                ->orderBy('expected_completion_date', 'ASC')
                ->get();

            return Inertia::render('StoreAdmin/OrdersPage', [
                'shopId' => $shopId,
                'shop' => $shop,
                'orders' => $orders
            ]);
        })->name('store.orders.page');

        Route::get('/store/order/{order}', [\App\Http\Controllers\Api\Dashboard\OrderController::class, 'showWeb'])->name('store.orders.show');
        Route::get('/store/reworks', [ReworkController::class, 'storeIndex'])->name('store.reworks.index');
        Route::prefix('/store/reworks')->name('store.reworks.')->group(function () {
            Route::patch('/{rework}/approve', [ReworkController::class, 'approve'])->name('approve');
            Route::patch('/{rework}/complete', [ReworkController::class, 'complete'])->name('complete');
        });
        Route::patch('/store/orders/{order}/accept', [\App\Http\Controllers\Api\Dashboard\OrderController::class, 'acceptOrder'])->name('store.orders.accept');
        Route::patch('/store/orders/{order}/reject', [\App\Http\Controllers\Api\Dashboard\OrderController::class, 'rejectOrder'])->name('store.orders.reject');
        Route::patch('/store/orders/{order}/quote', [\App\Http\Controllers\Api\Dashboard\OrderController::class, 'quote'])->name('store.orders.quote');
        Route::patch('/store/orders/{order}/request-measurements', [\App\Http\Controllers\Store\StoreDashboardController::class, 'requestMeasurements'])->name('store.orders.request-measurements');
        Route::patch('/store/orders/{order}/materials-received', [\App\Http\Controllers\Api\Dashboard\OrderController::class, 'markMaterialsReceived'])->name('store.orders.materials-received');
        Route::patch('/store/orders/{order}/measurements-taken', [\App\Http\Controllers\Api\Dashboard\OrderController::class, 'markMeasurementsTaken'])->name('store.orders.measurements-taken');
        Route::patch('/store/orders/{order}/payment-status', [\App\Http\Controllers\Api\Dashboard\OrderController::class, 'updatePaymentStatus'])->name('store.orders.payment-status');
        Route::post('/store/orders/{order}/cash-payment', [\App\Http\Controllers\Api\PaymentController::class, 'recordCashPayment'])->name('store.orders.cash-payment');
        Route::post('/store/orders/{order}/settle-balance', [\App\Http\Controllers\Api\PaymentController::class, 'settleRemainingBalance'])->name('store.orders.settle-balance');
        Route::patch('/store/order-reworks/{orderRework}/status', [\App\Http\Controllers\Api\OrderReworkController::class, 'updateStatus'])->name('store.order-reworks.update-status');
        Route::patch('/store/order-reworks/{orderRework}/accept', [\App\Http\Controllers\Api\OrderReworkController::class, 'accept'])->name('store.order-reworks.accept');
        Route::patch('/store/order-reworks/{orderRework}/reject', [\App\Http\Controllers\Api\OrderReworkController::class, 'reject'])->name('store.order-reworks.reject');
        Route::patch('/store/order-reworks/{orderRework}/received', [\App\Http\Controllers\Api\OrderReworkController::class, 'markGarmentReceived'])->name('store.order-reworks.received');

        // Update order status
        Route::patch('/store/orders/{order}/status', [\App\Http\Controllers\Api\Dashboard\OrderController::class, 'updateStatus'])
            ->name('store.orders.update-status');

        Route::patch('/api/shops/{shop}/orders/{order}', [\App\Http\Controllers\Api\Dashboard\OrderController::class, 'update'])->name('api.shops.orders.update');

        Route::post('/store/orders/{order}/photos', [\App\Http\Controllers\Api\Dashboard\OrderController::class, 'uploadPhoto'])->name('store.orders.upload-photo');
    });

    Route::post('/store/inventory', [App\Http\Controllers\Store\InventoryController::class, 'addServices'])->name('store.services.add');
    Route::put('/store/inventory/{id}', [App\Http\Controllers\Store\InventoryController::class, 'updateServices'])->name('store.services.update');
    Route::delete('/store/inventory/{id}', [App\Http\Controllers\Store\InventoryController::class, 'deleteServices'])->name('store.services.delete');
    Route::post('/store/attributes', [InventoryController::class, 'addAttribute'])->name('store.attributes.add');
    Route::put('/store/attributes/{id}', [InventoryController::class, 'updateShopAttribute'])->name('store.attributes.update');
    Route::delete('/store/attributes/{id}', [InventoryController::class, 'deleteShopAttribute'])->name('store.attributes.delete');
    Route::post('/store/master-attributes', [InventoryController::class, 'storeMasterAttribute'])->name('store.master-attributes.add');
    Route::post('/store/categories', [InventoryController::class, 'storeCategory'])->name('store.categories.add');
    
    Route::get('/store/{shop}/analytics/pending', [\App\Http\Controllers\Store\StoreDashboardController::class, 'pendingAnalytics']);
    Route::get('/store/{shop}/analytics/revenue', [\App\Http\Controllers\Store\StoreDashboardController::class, 'getRevenueAnalytics'])->name('store.analytics.revenue');
});

Route::get('/dashboard', [CustomerDashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

// Customer Orders - for users without shops (regular customers)
Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('/payments/generate', [PaymentController::class, 'generatePaymentLink'])->name('web.payments.generate');

    Route::get('/my-orders', function () {
        // Get orders for the current logged in user, prioritizing urgent/rush orders
        $orders = Order::where('user_id', Auth::id())
            ->with(['user.profile', 'service.serviceCategory', 'items.attribute', 'tailoringShop.attributes'])
            ->orderByRaw('(is_rush = 1 OR expected_completion_date <= NOW() + INTERVAL 2 DAY) DESC')
            ->orderBy('expected_completion_date', 'ASC')
            ->get();
            
        return Inertia::render('dashboard/MyOrders', [
            'orders' => $orders
        ]);
    })->name('customer.orders');

    // Customer Appointments Calendar
    Route::get('/my-appointments', [CustomerAppointmentsController::class, 'index'])->name('customer.appointments');
    Route::get('/my-reworks', [ReworkController::class, 'customerIndex'])->name('customer.reworks.index');

    // Customer measurement submission
    Route::patch('/my-orders/{order}/measurements', [\App\Http\Controllers\Api\Dashboard\CustomerOrderController::class, 'updateMeasurements'])->name('customer.orders.measurements');
    
    // Customer accept quote
    Route::get('/my-orders/{order}/accept', [\App\Http\Controllers\Api\Dashboard\CustomerOrderController::class, 'acceptQuoteFallback'])->name('customer.orders.accept.fallback');
    Route::patch('/my-orders/{order}/accept', [\App\Http\Controllers\Api\Dashboard\CustomerOrderController::class, 'acceptQuote'])->name('customer.orders.accept');
    Route::post('/orders/{order}/manual-payment', [PaymentController::class, 'submitManualPayment'])->name('orders.manual-payment');
    Route::post('/my-orders/{order}/manual-payment', [PaymentController::class, 'submitManualPayment'])->name('customer.orders.manual-payment');
    Route::patch('/my-orders/{order}/decline', [\App\Http\Controllers\Api\Dashboard\CustomerOrderController::class, 'declineQuote'])->name('customer.orders.decline');
    Route::post('/my-orders/{order}/rework', [\App\Http\Controllers\Api\OrderReworkController::class, 'store'])->name('customer.orders.rework.store');

    // Single order workspace page
    Route::get('/my-orders/{order}', [\App\Http\Controllers\Api\Dashboard\CustomerOrderController::class, 'showWeb'])->name('customer.orders.show');
});


Route::get('/shop/{shop}',  function ($shop){
    $shop = TailoringShop::where('status', 'approved')
        ->where('is_active', true)
        ->with(['services.serviceCategory', 'attributes', 'attributes.attributeCategory', 'user.profile'])
        ->findOrFail($shop);

    return Inertia::render('Shop', [
        'shop' => $shop
    ]);
});

Route::get('/', [HomeController::class, 'index'])->name('home');


Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('/impersonate/{user}', [ImpersonationController::class, 'impersonate'])->name('impersonate');
    Route::post('/impersonate/leave', [ImpersonationController::class, 'leaveImpersonation'])->name('impersonate.leave');
    // Public store order
    Route::post('/shops/{shop}/orders', [OrderController::class, 'publicStore']);
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('/payments/generate', [PaymentController::class, 'generatePaymentLink'])->name('payment.generate');
});

require __DIR__.'/auth.php';

