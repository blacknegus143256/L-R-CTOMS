<?php

use Illuminate\Support\Facades\Route;

// SPA: serve React app for all frontend routes
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '^(?!api|up|sanctum).*$')->name('app');
