<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\TailoringShop;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class StoreDashboardController extends Controller
{
    public function index()
    {
        // Fetch the shop owned by the logged-in Store Admin
        $shop = TailoringShop::where('user_id', Auth::id())->first();

        return Inertia::render('StoreAdmin/Dashboard', [
            'shop' => $shop,
            // We can add orders count here later
        ]);
    }
}
