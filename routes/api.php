<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\Dashboard\CustomerController;
use App\Http\Controllers\Api\Dashboard\DashboardShopController;
use App\Http\Controllers\Api\Dashboard\OrderController;
use App\Http\Controllers\Api\Dashboard\ServiceController;
use App\Http\Controllers\Api\ShopController;
use Illuminate\Support\Facades\Route;

// Public API (no auth required)
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/shops', [ShopController::class, 'index']);
Route::get('/shops/compare', [ShopController::class, 'compare'])->name('shops.compare');
Route::get('/shops/{shop}', [ShopController::class, 'show']);

// Auth (guest)
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Auth (sanctum)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);

    // Dashboard: my shops
    Route::get('/dashboard/shops', [DashboardShopController::class, 'index']);
    Route::get('/dashboard/shops/{shop}', [DashboardShopController::class, 'show']);

    // Dashboard: CRUD scoped by shop
    Route::apiResource('dashboard/shops/{shop}/services', ServiceController::class)->except(['show']);
    Route::apiResource('dashboard/shops/{shop}/customers', CustomerController::class)->except(['show']);
    Route::apiResource('dashboard/shops/{shop}/orders', OrderController::class)->except(['show']);
});
