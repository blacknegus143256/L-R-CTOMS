<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\SuperAdmin\DashboardController;
use App\Http\Controllers\SuperAdmin\UserController;
use App\Http\Controllers\Store\StoreDashboardController;
use App\Http\Controllers\Store\InventoryController;

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

        Route::post('/store/inventory', [App\Http\Controllers\Store\InventoryController::class, 'addServices'])->name('store.services.add');
        Route::put('/store/inventory/{id}', [App\Http\Controllers\Store\InventoryController::class, 'updateServices'])->name('store.services.update');
        Route::delete('/store/inventory/{id}', [App\Http\Controllers\Store\InventoryController::class, 'deleteServices'])->name('store.services.delete');
        Route::post('/store/attributes', [InventoryController::class, 'addAttribute'])->name('store.attributes.add');
        Route::put('/store/attributes/{id}', [InventoryController::class, 'updateShopAttribute'])->name('store.attributes.update');
        Route::delete('/store/attributes/{id}', [InventoryController::class, 'deleteShopAttribute'])->name('store.attributes.delete');
        Route::post('/store/master-attributes', [InventoryController::class, 'storeMasterAttribute'])->name('store.master-attributes.add');
        Route::post('/store/categories', [InventoryController::class, 'storeCategory'])->name('store.categories.add');
});

// Route::get('/', function () {
//     return Inertia::render('Welcome', [
//         'canLogin' => Route::has('login'),
//         'canRegister' => Route::has('register'),
//         'laravelVersion' => Application::VERSION,
//         'phpVersion' => PHP_VERSION,
//     ]);
// });

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');
Route::get('/', function () {
    return Inertia::render('Home');
})->name('home');
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
