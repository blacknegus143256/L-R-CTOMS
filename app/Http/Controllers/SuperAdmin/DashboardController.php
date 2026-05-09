<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderLog;
use App\Models\Report;
use App\Models\TailoringShop;
use App\Models\User;
use App\Models\ShopStatus;
use Inertia\Inertia;

class DashboardController extends Controller
{
   public function index()
    {
        $stats = [
            'total_shops' => TailoringShop::count(),
            'total_users' => User::where('role', 'customer')->count(),
            'total_orders' => Order::count(),
            'pending_reports' => Report::where('status', 'pending')->count(),
        ];

        return Inertia::render('SuperAdmin/Dashboard', [
            'stats' => $stats,
            'urgent_reports' => Report::with(['reporter', 'reported'])
                ->where('status', 'pending')
                ->latest()
                ->take(5)
                ->get(),
            'recent_logs' => OrderLog::with('user')
                ->latest()
                ->take(5)
                ->get(),
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
