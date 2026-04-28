<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\TailoringShop;
use Inertia\Inertia;

class DashboardController extends Controller
{
   public function index()
    {
        $shops = TailoringShop::latest()->get();

        return Inertia::render('SuperAdmin/Dashboard', [
            'stats' => [
                'total_shops' => TailoringShop::count(),
                'pending_shops' => TailoringShop::where('status', 'pending')->count(),
                'total_users' => \App\Models\User::count(),
            ],
            'shops' => $shops,
        ]);
    }
    public function approve($id)
    {
        // Fetch the shop details based on the provided ID
        $shop = \App\Models\TailoringShop::findOrFail($id);

        $shop->update(['status' => 'approved']);

        return redirect()->back()->with('message', 'Shop approved successfully!');
    }
    
    public function reject($id)
    {
        // Fetch the shop details based on the provided ID
        $shop = \App\Models\TailoringShop::findOrFail($id);

        $shop->update(['status' => 'rejected']);

        return redirect()->back()->with('message', 'Shop rejected successfully!');
    }
    public function demote($id)
    {
        // Fetch the shop details based on the provided ID
        $shop = \App\Models\TailoringShop::findOrFail($id);

        $shop->update(['status' => 'pending']);

        return redirect()->back()->with('message', 'Shop status set to pending successfully!');
    }
}
