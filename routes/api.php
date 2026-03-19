<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\Dashboard\CustomerController;
use App\Http\Controllers\Api\Dashboard\CustomerOrderController;
use App\Http\Controllers\Api\Dashboard\DashboardShopController;
use App\Http\Controllers\Api\Dashboard\OrderController;
use App\Http\Controllers\Api\Dashboard\ServiceController as DashboardServiceController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\ShopController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
// Public API (no auth required)
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/services', [ServiceController::class, 'index']);
Route::get('/shops', [ShopController::class, 'index']);
Route::get('/shops/compare', [ShopController::class, 'compare'])->name('shops.compare');
Route::get('/shops/{shop}', [ShopController::class, 'show']);

// Customer orders (public - for placing orders)

// Auth (optional) - for customers to view their orders and check profile
Route::middleware('auth:sanctum')->group(function () {
    
    Route::post('/shops/{shop}/orders', [CustomerOrderController::class, 'store']);
    Route::get('/customer/orders', [CustomerOrderController::class, 'index']);
    Route::get('/customer/orders/{order}', [CustomerOrderController::class, 'show']);
    Route::get('/customer/profile-check', [CustomerOrderController::class, 'checkProfile']);
});

// Auth (guest)
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Auth (sanctum)
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    $user = $request->user();
    $shops = [];
    if ($user->shop) {
        $shops = [$user->shop];
    }
    return response()->json([
        'user' => $user,
        'shops' => $shops,
    ]);
});

// Auth (sanctum protected)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);
    
    // Dashboard: my shops
    Route::get('/dashboard/shops', [DashboardShopController::class, 'index']);
    Route::get('/dashboard/shops/{shop}', [DashboardShopController::class, 'show']);

    // Dashboard: CRUD scoped by shop
    Route::apiResource('dashboard/shops/{shop}/services', DashboardServiceController::class)->except(['show']);
    Route::apiResource('dashboard/shops/{shop}/customers', CustomerController::class)->except(['show']);
    Route::apiResource('dashboard/shops/{shop}/orders', OrderController::class)->except(['show']);
    Route::get('dashboard/shops/{shop}/orders/{order}', [OrderController::class, 'show']);
});
