<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\TailoringShop;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerDashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'super_admin') {
            return redirect()->route('super.dashboard');
        }

        if ($user->role === 'store_admin') {
            return redirect()->route('store.dashboard');
        }

        $orders = Order::where('user_id', $user->id)->get();

        $activeCount = $orders->whereIn('status', ['Pending', 'Accepted', 'In Progress', 'Appointment Scheduled'])->count();
        $readyCount = $orders->where('status', 'Ready')->count();
        $totalSpent = $orders->where('status', 'Completed')->sum('total_price');

        $recentOrders = Order::where('user_id', $user->id)
            ->with(['tailoringShop', 'service'])
            ->latest()
            ->take(5)
            ->get();

        $today = Carbon::today();
        $confirmedOrders = Order::where('user_id', $user->id)
            ->where('status', 'Confirmed')
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

                $dropoffToday = $order->material_dropoff_date
                    ? Carbon::parse($order->material_dropoff_date)->isSameDay($today)
                    : false;
                $fittingToday = $order->measurement_date
                    ? Carbon::parse($order->measurement_date)->isSameDay($today)
                    : false;

                if ($dropoffToday || $fittingToday) {
                    $appointmentType = $dropoffToday && $fittingToday
                        ? 'Drop-off and Fitting'
                        : ($dropoffToday ? 'Drop-off' : 'Fitting');

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

        $recommendedShops = TailoringShop::where('status', 'approved')
            ->where('is_active', true)
            ->inRandomOrder()
            ->take(3)
            ->get();

        return Inertia::render('Dashboard', [
            'stats' => [
                'active' => $activeCount,
                'ready' => $readyCount,
                'totalSpent' => $totalSpent,
            ],
            'recentOrders' => $recentOrders,
            'measurements' => $measurements,
            'recommendedShops' => $recommendedShops,
            'urgentReminders' => $urgentReminders,
        ]);
    }
}
