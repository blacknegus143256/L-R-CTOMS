<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Holiday;
use App\Models\ShopException;
use App\Models\TailoringShop;
use App\Models\Order;
use App\Models\OrderItem;
use App\Notifications\OrderUpdatedNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class StoreDashboardController extends Controller
{
    public function appointments(Request $request)
    {
        $shop = TailoringShop::with('schedules')
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $month = (int) $request->integer('month', now()->month);
        $year = (int) $request->integer('year', now()->year);

        $appointments = Appointment::with(['user', 'order.service'])
            ->where('shop_id', $shop->id)
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->orderBy('date')
            ->orderBy('time_start')
            ->get();

        $exceptions = ShopException::where('shop_id', $shop->id)
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->get()
            ->keyBy(fn ($e) => \Carbon\Carbon::parse($e->date)->format('Y-m-d'));

        $holidays = Holiday::whereYear('date', $year)
            ->whereMonth('date', $month)
            ->get()
            ->keyBy(fn ($h) => \Carbon\Carbon::parse($h->date)->format('Y-m-d'))
            ->map->name;

        $appointmentsByDate = $appointments
            ->groupBy(fn ($apt) => Carbon::parse($apt->date)->format('Y-m-d'))
            ->map(fn ($group) => $group->values())
            ->toArray();

        return Inertia::render('StoreAdmin/Appointments', [
            'appointmentsByDate' => $appointmentsByDate,
            'exceptionsByDate' => $exceptions->toArray(),
            'holidaysByDate' => $holidays->toArray(),
            'shop' => $shop,
            'month' => $month,
            'year' => $year,
        ]);
    }

    public function index()
    {
        $userId = Auth::id();
        $shop = TailoringShop::withCount(['services', 'attributes'])->where('user_id', $userId)->first();
        $activeStatuses = ['Quoted', 'Confirmed', 'Ready for Production', 'In Progress'];

        if (!$shop) {
            return Inertia::render('StoreAdmin/Dashboard', [
                'shop' => null,
                'stats' => null,
                'topServices' => [],
                'topMaterials' => [],
                'urgentOrders' => [],
                'weeklyOrders' => [],
                'overdueOrders' => [],
                'upcomingDeadlines' => [],
                'heatmapData' => [],
                'recentActivity' => [],
            ]);
        }

        $totalRevenue = Order::where('tailoring_shop_id', $shop->id)
            ->where('status', 'Completed')
            ->sum('total_price');

$pendingOrders = Order::where('tailoring_shop_id', $shop->id)
    ->whereIn('status', ['Requested', 'Quoted'])
    ->count();

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

$activeCustomers = Order::where('tailoring_shop_id', $shop->id)
            ->distinct()
            ->count('user_id');

        $currentMonth = now()->startOfMonth();
        $lastMonthStart = now()->subMonth()->startOfMonth();
        $lastMonthEnd = $currentMonth->copy()->subSecond();
        $currentRevenue = Order::where('tailoring_shop_id', $shop->id)
            ->where('status', 'Completed')
            ->where('created_at', '>=', $currentMonth)
            ->sum('total_price');
        $lastRevenue = Order::where('tailoring_shop_id', $shop->id)
            ->where('status', 'Completed')
            ->where('created_at', '>=', $lastMonthStart)
            ->where('created_at', '<', $lastMonthEnd)
            ->sum('total_price');
        $revenueGrowth = $lastRevenue > 0 ? round((($currentRevenue - $lastRevenue) / $lastRevenue) * 100, 1) : 100;

        $todayStart = now()->startOfDay();
        $nextSevenDaysEnd = now()->addDays(7)->endOfDay();

        $overdueOrders = Order::where('tailoring_shop_id', $shop->id)
            ->whereIn('status', $activeStatuses)
            ->whereNotNull('expected_completion_date')
            ->where('expected_completion_date', '<', $todayStart)
            ->with('customer:id,name,email,phone_number')
            ->orderBy('expected_completion_date', 'asc')
            ->get();

        $upcomingDeadlines = Order::where('tailoring_shop_id', $shop->id)
            ->whereIn('status', $activeStatuses)
            ->whereNotNull('expected_completion_date')
            ->whereBetween('expected_completion_date', [$todayStart, $nextSevenDaysEnd])
            ->with('customer:id,name,email,phone_number')
            ->orderBy('expected_completion_date', 'asc')
            ->get();

        $heatmapData = Order::where('tailoring_shop_id', $shop->id)
            ->whereIn('status', $activeStatuses)
            ->whereNotNull('expected_completion_date')
            ->whereBetween('expected_completion_date', [now()->startOfWeek(), now()->endOfWeek()])
            ->selectRaw('DATE(expected_completion_date) as date, COUNT(*) as total, SUM(is_rush) as rush_count')
            ->groupByRaw('DATE(expected_completion_date)')
            ->orderByRaw('DATE(expected_completion_date) ASC')
            ->get();

        $weekStart = now()->startOfWeek(Carbon::MONDAY)->startOfDay();
        $weekEnd = now()->endOfWeek(Carbon::SUNDAY)->endOfDay();

        $weeklyOrders = Order::where('tailoring_shop_id', $shop->id)
            ->whereBetween('expected_completion_date', [$weekStart, $weekEnd])
            ->whereNotIn('status', ['Completed', 'Cancelled', 'Rejected', 'Declined'])
            ->with('customer:id,name,email,phone_number')
            ->orderByRaw('rush_order DESC')
            ->orderBy('expected_completion_date', 'asc')
            ->get();

        $topServices = Order::where('tailoring_shop_id', $shop->id)
            ->select('service_id', DB::raw('count(*) as total'))
            ->with('service:id,service_name')
            ->groupBy('service_id')
            ->orderByDesc('total')
            ->take(5)
            ->get();

        $topMaterials = OrderItem::whereHas('order', function($query) use ($shop) {
                $query->where('tailoring_shop_id', $shop->id);
            })
            ->select('attribute_type_id', DB::raw('count(*) as total'))
            ->with('attribute:id,name')
            ->groupBy('attribute_type_id')
            ->orderByDesc('total')
            ->take(5)
            ->get();

        $urgentOrders = Order::where('tailoring_shop_id', $shop->id)
            ->whereIn('status', ['Accepted', 'Ready for Production', 'In Progress', 'Appointment Scheduled'])
            ->whereNotNull('expected_completion_date')
            ->where('expected_completion_date', '<=', now()->addHours(48))
            ->with('customer:id,name,email,phone_number')
            ->orderBy('expected_completion_date')
            ->take(5)
            ->get();

        $rushOrders = Order::where('tailoring_shop_id', $shop->id)
            ->where('rush_order', true)
            ->whereIn('status', ['Requested', 'Quoted', 'Accepted', 'Ready for Production', 'In Progress', 'Appointment Scheduled'])
            ->whereNotNull('expected_completion_date')
            ->whereBetween('expected_completion_date', [now()->startOfDay(), now()->addDays(7)->endOfDay()])
            ->with('customer:id,name,email,phone_number')
            ->orderBy('expected_completion_date')
            ->get();

        $today = now()->toDateString();
        $dailyAgenda = Order::where('tailoring_shop_id', $shop->id)
            ->whereIn('status', ['Confirmed', 'Ready for Production'])
            ->where(function ($query) use ($today) {
                $query->whereDate('material_dropoff_date', $today)
                    ->orWhereDate('measurement_date', $today);
            })
            ->with([
                'user:id,name',
                'customer:id,name',
                'appointments' => function ($query) use ($today) {
                    $query->whereDate('date', $today)->orderBy('time_start');
                },
            ])
            ->orderByRaw('COALESCE(material_dropoff_date, measurement_date) ASC')
            ->get()
            ->map(function (Order $order) use ($today) {
                $hasDropOff = optional($order->material_dropoff_date)->isSameDay(Carbon::parse($today));
                $hasFitting = optional($order->measurement_date)->isSameDay(Carbon::parse($today));

                $agendaType = match (true) {
                    $hasDropOff && $hasFitting => 'Drop-off & Fitting',
                    $hasDropOff => 'Drop-off',
                    $hasFitting => 'Fitting',
                    default => 'Agenda',
                };

                $agendaTime = $order->appointments
                    ->pluck('time_start')
                    ->filter()
                    ->map(fn ($time) => Carbon::createFromFormat('H:i:s', $time)->format('h:i A'))
                    ->implode(' • ');

                $order->setAttribute('agenda_type', $agendaType);
                $order->setAttribute('agenda_time', $agendaTime ?: 'All day');

                return $order;
            })
            ->values();

$recentActivity = Order::where('tailoring_shop_id', $shop->id)
            ->orderByDesc('updated_at')
            ->take(5)
            ->with(['customer:id,name'])
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'message' => "Order #{$order->id} updated to {$order->status->value}",
                    'time' => $order->updated_at->diffForHumans(),
                    'type' => 'Order Update'
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
                'revenueGrowth' => $revenueGrowth,
            ],
            'topServices' => $topServices,
            'topMaterials' => $topMaterials,
            'urgentOrders' => $urgentOrders,
            'rushOrders' => $rushOrders,
            'dailyAgenda' => $dailyAgenda,
            'weeklyOrders' => $weeklyOrders,
            'overdueOrders' => $overdueOrders,
            'upcomingDeadlines' => $upcomingDeadlines,
            'heatmapData' => $heatmapData,
            'recentActivity' => $recentActivity,
        ]);
    }

    public function updateDescription(Request $request)
    {
        $request->validate([
            'description' => 'nullable|string|max:500'
        ]);

        $userId = Auth::id();
        $shop = TailoringShop::where('user_id', $userId)->first();

        if (!$shop) {
            return response()->json(['message' => 'Shop not found.'], 404);
        }

        $shop->update(['description' => $request->description]);

        return response()->json([
            'message' => 'Description updated successfully.', 
            'description' => $shop->fresh()->description
        ]);
    }

    /**
     * Shop Settings page
     */
    public function shopSettings(TailoringShop $shop)
    {
        if ($shop->user_id !== Auth::id()) {
            abort(403, 'Unauthorized - not your shop.');
        }

        // Just load the services safely
        $shop->load(['services.serviceCategory']);

        return Inertia::render('StoreAdmin/ShopSettings', [
            'shop' => $shop
        ]);
    }

    public function pendingAnalytics(\App\Models\TailoringShop $shop)
    {
        if ($shop->user_id !== Auth::id()) {
            abort(403);
        }

        $pendingOrders = \App\Models\Order::with(['customer', 'user', 'service'])
            ->where('tailoring_shop_id', $shop->id)
            ->whereIn('status', ['Requested', 'Quoted'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($order) {
                $customer = $order->customer ?? $order->user;

                return [
                    'id' => $order->id,
                    'status' => $order->status,
                    'created_at' => $order->created_at,
                    'service' => $order->service,
                    'customer' => $customer,
                ];
            });

        return response()->json(['orders' => $pendingOrders]);
    }

    public function getRevenueAnalytics(Request $request, \App\Models\TailoringShop $shop)
    {
        if ($shop->user_id !== Auth::id()) {
            abort(403);
        }

        $granularity = $request->string('granularity', 'daily')->toString();
        $granularity = in_array($granularity, ['daily', 'monthly', 'yearly'], true) ? $granularity : 'daily';

        $baseQuery = Order::where('tailoring_shop_id', $shop->id)
            ->where('status', 'Completed');

        if ($granularity === 'monthly') {
            $data = (clone $baseQuery)
                ->selectRaw("DATE_FORMAT(created_at, '%Y-%m-01') as period, SUM(total_price) as total")
                ->where('created_at', '>=', now()->subMonths(11)->startOfMonth())
                ->groupBy('period')
                ->orderBy('period', 'asc')
                ->get()
                ->map(function ($item) {
                    $item->label = Carbon::parse($item->period)->format('M Y');
                    $item->total = (float) $item->total;
                    return $item;
                });
        } elseif ($granularity === 'yearly') {
            $data = (clone $baseQuery)
                ->selectRaw('YEAR(created_at) as period, SUM(total_price) as total')
                ->where('created_at', '>=', now()->subYears(4)->startOfYear())
                ->groupBy('period')
                ->orderBy('period', 'asc')
                ->get()
                ->map(function ($item) {
                    $item->label = (string) $item->period;
                    $item->total = (float) $item->total;
                    return $item;
                });
        } else {
            $data = (clone $baseQuery)
                ->selectRaw('DATE(created_at) as period, SUM(total_price) as total')
                ->where('created_at', '>=', now()->subDays(30))
                ->groupBy('period')
                ->orderBy('period', 'asc')
                ->get()
                ->map(function ($item) {
                    $item->label = Carbon::parse($item->period)->format('M d');
                    $item->total = (float) $item->total;
                    return $item;
                });
        }

        return response()->json([
            'granularity' => $granularity,
            'revenue' => $data
        ]);
    }

    public function requestMeasurements(Request $request, Order $order)
    {
        $user = $request->user();
        $shop = $user->tailoringShops()->first() ?? null;

        if (
            !$shop ||
            $order->tailoring_shop_id !== $shop->id
        ) {
            abort(403, 'Unauthorized action.');
        }

        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'measurement_fields' => 'required|array',
            'measurement_unit' => 'required|string|in:inches,cm',
        ]);

        if ($validator->fails()) {
            return redirect()->route('store.orders.show', $order->id)
                ->withErrors($validator)
                ->withInput();
        }

        $validated = $validator->validated();

        $snapshot = $order->measurement_snapshot ?? [];

        $snapshot['requested'] = $validated['measurement_fields'];
        $snapshot['unit'] = $validated['measurement_unit'] ?? ($snapshot['unit'] ?? 'inches');

        $order->update([
            'measurement_snapshot' => $snapshot
        ]);

        $requiresInShopMeasurements = Order::requiresInShopMeasurements($order->measurement_type);

        if ($requiresInShopMeasurements) {
            $order->update(['measurements_taken' => true]);
            $this->checkReadyForProduction($order);
        }

        if ($order->user) {
            // Anti-spam throttle: Check for duplicate notifications within 5 minutes
            $recentNotification = DB::table('notifications')
                ->where('data->type', 'measurement_requested')
                ->where('data->order_id', $order->id)
                ->where('created_at', '>=', now()->subMinutes(5))
                ->whereNull('read_at')
                ->exists();

            if (!$recentNotification) {
                $order->user->notify(new OrderUpdatedNotification(
                    $order,
                    "Your tailor requested measurements for order #{$order->id}.",
                    'measurement_requested'
                ));
            }
        }

        return redirect()->route('store.orders.show', $order->id)
            ->with('success', 'Measurement request updated successfully.');
    }

    private function checkReadyForProduction(Order $order): void
    {
        $currentStatus = $order->status instanceof \BackedEnum
            ? $order->status->value
            : (string) $order->status;

        if ($currentStatus !== 'Confirmed') {
            return;
        }

        $needsMaterials = $order->material_source === 'customer';
        $needsMeasurements = Order::requiresInShopMeasurements($order->measurement_type);

        $logisticsMet = (! $needsMaterials || $order->materials_received)
            && (! $needsMeasurements || $order->measurements_taken);

        // Production unlocks if payment is 'Partial' OR 'Paid' (not restricted to full payment only)
        $paymentMet = in_array($order->payment_status, ['Partial', 'Paid'], true);

        if ($logisticsMet && $paymentMet) {
            $order->update(['status' => 'Ready for Production']);
            $order->loadMissing(['user', 'tailoringShop', 'customer']);

            $order->user?->notify(new OrderUpdatedNotification(
                $order,
                'Your order is verified and ready for production.',
                'ready_for_production'
            ));
        }
    }
}


