<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\TailoringShop;
use App\Models\ShopStatus;
use Inertia\Inertia;

class DashboardController extends Controller
{
   public function index()
    {
        $pendingStatusId = ShopStatus::where('name', 'Pending')->value('id');
        $shops = TailoringShop::latest()->get();

        return Inertia::render('SuperAdmin/Dashboard', [
            'stats' => [
                'total_shops' => TailoringShop::count(),
                'pending_shops' => TailoringShop::where('shop_status_id', $pendingStatusId)->count(),
                'total_users' => \App\Models\User::count(),
            ],
            'shops' => $shops,
        ]);
    }
    public function approve($id)
    {
        // Fetch the shop details based on the provided ID
        $shop = \App\Models\TailoringShop::findOrFail($id);

        $approvedId = ShopStatus::where('name', 'Approved')->value('id');
        $shop->update(['shop_status_id' => $approvedId]);

        return redirect()->back()->with('message', 'Shop approved successfully!');
    }
    
    public function reject($id)
    {
        // Fetch the shop details based on the provided ID
        $shop = \App\Models\TailoringShop::findOrFail($id);

        $rejectedId = ShopStatus::where('name', 'Rejected')->value('id');
        $shop->update(['shop_status_id' => $rejectedId]);

        return redirect()->back()->with('message', 'Shop rejected successfully!');
    }
    public function demote($id)
    {
        // Fetch the shop details based on the provided ID
        $shop = \App\Models\TailoringShop::findOrFail($id);

        $pendingId = ShopStatus::where('name', 'Pending')->value('id');
        $shop->update(['shop_status_id' => $pendingId]);

        return redirect()->back()->with('message', 'Shop status set to pending successfully!');
    }
}
