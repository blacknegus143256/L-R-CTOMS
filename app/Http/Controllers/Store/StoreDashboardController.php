<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\TailoringShop;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StoreDashboardController extends Controller
{
    public function index()
    {
        // Fetch the shop owned by the logged-in Store Admin
        $shop = TailoringShop::where('user_id', Auth::id())->first();

        if (!$shop) {
            return Inertia::render('StoreAdmin/Dashboard', [
                'shop' => null,
                'stats' => null,
                'topServices' => [],
                'topMaterials' => [],
                'urgentOrders' => [],
                'recentActivity' => [],
            ]);
        }

        // KPI Stats
        $totalRevenue = Order::where('tailoring_shop_id', $shop->id)
            ->where('status', 'Completed')
            ->sum('total_price');

        $pendingOrders = Order::where('tailoring_shop_id', $shop->id)
            ->where('status', 'Pending')
            ->count();

        // Monthly Growth - compare this month vs last month
        $thisMonth = Order::where('tailoring_shop_id', $shop->id)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        $lastMonth = Order::where('tailoring_shop_id', $shop->id)
            ->whereMonth('created_at', now()->subMonth()->month)
            ->whereYear('created_at', now()->subMonth()->year)
            ->count();

        $monthlyGrowth = $lastMonth > 0 
            ? round((($thisMonth - $lastMonth) / $lastMonth) * 100, 1) 
            : ($thisMonth > 0 ? 100 : 0);

        // Active Customers - unique customers who placed orders
        $activeCustomers = Order::where('tailoring_shop_id', $shop->id)
            ->distinct()
            ->count('user_id');

        // Top Services - most ordered services
        $topServices = Order::where('tailoring_shop_id', $shop->id)
            ->select('service_id', DB::raw('count(*) as total'))
            ->with('service:id,service_name')
            ->groupBy('service_id')
            ->orderByDesc('total')
            ->take(5)
            ->get();

        // Top Materials - most used attributes from order_items
        $topMaterials = OrderItem::whereHas('order', function($query) use ($shop) {
                $query->where('tailoring_shop_id', $shop->id);
            })
            ->select('attribute_type_id', DB::raw('count(*) as total'))
            ->with('attribute:id,name')
            ->groupBy('attribute_type_id')
            ->orderByDesc('total')
            ->take(5)
            ->get();

        // Urgent Orders - orders nearing deadline (within 48 hours)
        $urgentOrders = Order::where('tailoring_shop_id', $shop->id)
            ->whereIn('status', ['Accepted', 'In Progress', 'Appointment Scheduled'])
            ->whereNotNull('expected_completion_date')
            ->where('expected_completion_date', '<=', now()->addHours(48))
            ->with('customer:id,name,email,phone_number')
            ->orderBy('expected_completion_date')
            ->take(5)
            ->get();

        // Recent Activity - simulated from recent orders
        $recentOrders = Order::where('tailoring_shop_id', $shop->id)
            ->with('customer:id,name')
            ->latest()
            ->take(5)
            ->get();

        $recentActivity = $recentOrders->map(function($order) {
            return [
                'id' => $order->id,
                'type' => 'new_order',
                'message' => 'New order placed by ' . ($order->customer->name ?? 'Customer') . ' for ' . ($order->service->service_name ?? 'Service'),
                'time' => $order->created_at->diffForHumans(),
            ];
        });

        return Inertia::render('StoreAdmin/Dashboard', [
            'shop' => $shop,
            'stats' => [
                'totalRevenue' => $totalRevenue,
                'pendingOrders' => $pendingOrders,
                'monthlyGrowth' => $monthlyGrowth,
                'activeCustomers' => $activeCustomers,
                'totalOrders' => Order::where('tailoring_shop_id', $shop->id)->count(),
            ],
            'topServices' => $topServices,
            'topMaterials' => $topMaterials,
            'urgentOrders' => $urgentOrders,
            'recentActivity' => $recentActivity,
        ]);
    }
}

