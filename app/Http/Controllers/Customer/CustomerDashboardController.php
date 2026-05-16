<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\TailoringShop;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerDashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        if ($user->role === 'super_admin') {
            return redirect()->route('super.dashboard');
        }

        if ($user->role === 'store_admin') {
            return redirect()->route('store.dashboard');
        }

        if (in_array($user->role, ['store_staff', 'staff'], true)) {
            return redirect()->route('staff.dashboard');
        }

        $activeOrdersCount = Order::where('user_id', $user->id)
            ->whereHas('status', function ($query) {
                $query->whereNotIn('name', ['Completed', 'Cancelled', 'Declined', 'Rejected']);
            })
            ->count();

        $readyForPickupCount = Order::where('user_id', $user->id)
            ->whereHas('status', function ($query) {
                $query->where('name', 'Ready for Pickup');
            })
            ->count();

        $totalSpent = (float) Order::where('user_id', $user->id)
            ->whereHas('status', function ($query) {
                $query->where('name', 'Completed');
            })
            ->sum('total_amount');

        $recentOrders = Order::where('user_id', $user->id)
            ->with(['status', 'tailoringShop', 'orderServices.service'])
            ->latest()
            ->take(5)
            ->get();

        $today = Carbon::today();
        $confirmedOrders = Order::where('user_id', $user->id)
            ->whereHas('status', function ($query) {
                $query->where('name', 'Confirmed');
            })
            ->whereHas('appointments', function ($query) use ($today) {
                $query->whereDate('date', $today);
            })
            ->with([
                'tailoringShop:id,shop_name',
                'appointments' => fn ($query) => $query
                    ->whereDate('date', $today)
                    ->orderBy('time_start'),
            ])
            ->get();

        $urgentReminders = $confirmedOrders
            ->flatMap(function (Order $order) use ($today) {
                $reminders = [];
                $shopName = $order->tailoringShop?->shop_name ?? 'your tailor';

                if ($order->payment_status === 'Pending') {
                    $reminders[] = [
                        'type' => 'payment',
                        'message' => "Payment reminder: Order #{$order->id} at {$shopName} is still pending.",
                        'action_link' => route('customer.orders.show', $order->id),
                    ];
                }

                $hasAppointmentToday = $order->appointments->isNotEmpty();

                if ($hasAppointmentToday) {
                    $appointmentType = 'Appointment';

                    $times = $order->appointments
                        ->pluck('time_start')
                        ->filter()
                        ->map(fn ($time) => Carbon::parse($time)->format('h:i A'))
                        ->implode(' • ');

                    if ($times === '') {
                        $times = 'Today';
                    }

                    $reminders[] = [
                        'type' => 'appointment',
                        'message' => "{$appointmentType} reminder: Order #{$order->id} at {$shopName} is scheduled for {$times}.",
                        'action_link' => route('customer.orders.show', $order->id),
                    ];
                }

                return $reminders;
            })
            ->sortBy(fn (array $reminder) => match ($reminder['type']) {
                'appointment' => 0,
                'payment' => 1,
                default => 2,
            })
            ->values();

        $measurements = $user->profile;

        $featuredShops = TailoringShop::whereHas('shopStatus', function ($query) {
                $query->where('name', 'Approved');
            })
            ->where('is_active', true)
            ->withCount(['orders as completed_orders_count' => function ($query) {
                $query->whereHas('status', function ($q) {
                    $q->where('name', 'Completed');
                });
            }])
            ->orderByDesc('completed_orders_count')
            ->take(3)
            ->get();

        return Inertia::render('Dashboard', [
            'activeOrdersCount' => $activeOrdersCount,
            'readyForPickupCount' => $readyForPickupCount,
            'totalSpent' => $totalSpent,
            'stats' => [
                'active' => $activeOrdersCount,
                'ready' => $readyForPickupCount,
                'totalSpent' => $totalSpent,
            ],
            'recentOrders' => $recentOrders,
            'measurements' => $measurements,
            'featuredShops' => $featuredShops,
            // Backward-compatible alias for existing UI consumers.
            'recommendedShops' => $featuredShops,
            'urgentReminders' => $urgentReminders,
        ]);
    }
}
