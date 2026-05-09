<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Holiday;
use App\Models\OrderMeasurement;
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

        $totalRevenue = DB::table('order_services')
            ->join('orders', 'order_services.order_id', '=', 'orders.id')
            ->join('order_statuses', 'orders.order_status_id', '=', 'order_statuses.id')
            ->where('orders.tailoring_shop_id', $shop->id)
            ->where('order_statuses.name', 'Completed')
            ->selectRaw('COALESCE(SUM(order_services.price * order_services.quantity), 0) as total')
            ->value('total');

$pendingOrders = Order::where('tailoring_shop_id', $shop->id)
    ->whereHas('status', function ($query) {
        $query->whereIn('name', ['Requested', 'Quoted']);
    })
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
        $currentRevenue = DB::table('order_services')
            ->join('orders', 'order_services.order_id', '=', 'orders.id')
            ->join('order_statuses', 'orders.order_status_id', '=', 'order_statuses.id')
            ->where('orders.tailoring_shop_id', $shop->id)
            ->where('order_statuses.name', 'Completed')
            ->where('orders.created_at', '>=', $currentMonth)
            ->selectRaw('COALESCE(SUM(order_services.price * order_services.quantity), 0) as total')
            ->value('total');

        $lastRevenue = DB::table('order_services')
            ->join('orders', 'order_services.order_id', '=', 'orders.id')
            ->join('order_statuses', 'orders.order_status_id', '=', 'order_statuses.id')
            ->where('orders.tailoring_shop_id', $shop->id)
            ->where('order_statuses.name', 'Completed')
            ->where('orders.created_at', '>=', $lastMonthStart)
            ->where('orders.created_at', '<', $lastMonthEnd)
            ->selectRaw('COALESCE(SUM(order_services.price * order_services.quantity), 0) as total')
            ->value('total');
        $revenueGrowth = $lastRevenue > 0 ? round((($currentRevenue - $lastRevenue) / $lastRevenue) * 100, 1) : 100;

        $todayStart = now()->startOfDay();
        $nextSevenDaysEnd = now()->addDays(7)->endOfDay();

        $overdueOrders = Order::where('tailoring_shop_id', $shop->id)
            ->whereHas('status', function ($query) use ($activeStatuses) {
                $query->whereIn('name', $activeStatuses);
            })
            ->whereNotNull('expected_completion_date')
            ->where('expected_completion_date', '<', $todayStart)
            ->with('customer:id,name,email,phone_number')
            ->orderBy('expected_completion_date', 'asc')
            ->get();

        $upcomingDeadlines = Order::where('tailoring_shop_id', $shop->id)
            ->whereHas('status', function ($query) use ($activeStatuses) {
                $query->whereIn('name', $activeStatuses);
            })
            ->whereNotNull('expected_completion_date')
            ->whereBetween('expected_completion_date', [$todayStart, $nextSevenDaysEnd])
            ->with('customer:id,name,email,phone_number')
            ->orderBy('expected_completion_date', 'asc')
            ->get();

        $heatmapData = Order::where('tailoring_shop_id', $shop->id)
            ->whereHas('status', function ($query) use ($activeStatuses) {
                $query->whereIn('name', $activeStatuses);
            })
            ->whereNotNull('expected_completion_date')
            ->whereBetween('expected_completion_date', [now()->startOfWeek(), now()->endOfWeek()])
            ->selectRaw('DATE(expected_completion_date) as date, COUNT(*) as total, SUM(CASE WHEN COALESCE(is_rush, 0) <> 0 THEN 1 ELSE 0 END) as rush')
            ->groupByRaw('DATE(expected_completion_date)')
            ->orderByRaw('DATE(expected_completion_date) ASC')
            ->get();

        $weekStart = now()->startOfWeek(Carbon::MONDAY)->startOfDay();
        $weekEnd = now()->endOfWeek(Carbon::SUNDAY)->endOfDay();

        $weeklyOrders = Order::where('tailoring_shop_id', $shop->id)
            ->whereBetween('expected_completion_date', [$weekStart, $weekEnd])
            ->whereHas('status', function ($query) {
                $query->whereNotIn('name', ['Completed', 'Cancelled', 'Rejected', 'Declined']);
            })
            ->with('customer:id,name,email,phone_number')
            ->orderByRaw('is_rush DESC')
            ->orderBy('expected_completion_date', 'asc')
            ->get();

        $topServices = \App\Models\OrderService::whereHas('order', function($q) use ($shop) {
                $q->where('tailoring_shop_id', $shop->id);
            })
            ->select('service_id', DB::raw('count(*) as total'))
            ->with('service:id,service_name')
            ->groupBy('service_id')
            ->orderByDesc('total')
            ->take(5)
            ->get();

        $topMaterials = OrderItem::whereHas('order', function($query) use ($shop) {
                $query->where('tailoring_shop_id', $shop->id);
            })
            ->select('shop_attribute_id', DB::raw('count(*) as total'))
            ->with('shopAttribute:shop_attributes.id,shop_attributes.item_name')
            ->groupBy('shop_attribute_id')
            ->orderByDesc('total')
            ->take(5)
            ->get();

        $urgentOrders = Order::where('tailoring_shop_id', $shop->id)
            ->whereHas('status', function ($query) {
                $query->whereIn('name', ['Accepted', 'Ready for Production', 'In Progress', 'Appointment Scheduled']);
            })
            ->whereNotNull('expected_completion_date')
            ->where('expected_completion_date', '<=', now()->addHours(48))
            ->with('customer:id,name,email,phone_number')
            ->orderBy('expected_completion_date')
            ->take(5)
            ->get();

        $rushOrders = Order::where('tailoring_shop_id', $shop->id)
            ->where('is_rush', true)
            ->whereHas('status', function ($query) {
                $query->whereIn('name', ['Requested', 'Quoted', 'Accepted', 'Ready for Production', 'In Progress', 'Appointment Scheduled']);
            })
            ->whereNotNull('expected_completion_date')
            ->whereBetween('expected_completion_date', [now()->startOfDay(), now()->addDays(7)->endOfDay()])
            ->with('customer:id,name,email,phone_number')
            ->orderBy('expected_completion_date')
            ->get();

        $today = now()->toDateString();
        $dailyAgenda = Order::where('tailoring_shop_id', $shop->id)
            ->whereHas('status', function ($query) {
                $query->whereIn('name', ['Confirmed', 'Ready for Production']);
            })
            ->whereHas('appointments', function ($query) use ($today) {
                $query->whereDate('date', $today);
            })
            ->with([
                'user:id,name',
                'customer:id,name',
                'appointments' => function ($query) use ($today) {
                    $query->whereDate('date', $today)->orderBy('time_start');
                },
            ])
            ->orderBy('id')
            ->get()
            ->map(function (Order $order) use ($today) {
                $agendaType = 'Appointment';

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
                    'message' => "Order #{$order->id} updated to {$order->status}",
                    'time' => $order->updated_at->diffForHumans(),
                    'type' => 'Order Update'
                ];
            });

        $lowStockItems = $shop->attributes()
            ->select('shop_attributes.id', 'shop_attributes.item_name', 'shop_attributes.stock_quantity')
            ->where('stock_quantity', '<', 15)
            ->orderBy('stock_quantity', 'asc')
            ->take(5)
            ->get();

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
            'lowStockItems' => $lowStockItems,
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
            ->whereHas('status', function ($query) {
                $query->whereIn('name', ['Requested', 'Quoted']);
            })
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
            ->whereHas('status', function ($query) {
                $query->where('name', 'Completed');
            });

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

        $requestedMeasurements = collect($validated['measurement_fields'])
            ->map(function ($field) {
                return [
                    'name' => trim((string) ($field['name'] ?? $field['part'] ?? '')),
                    'instruction' => $field['instruction'] ?? null,
                ];
            })
            ->filter(fn ($field) => $field['name'] !== '')
            ->values();

        $requestedNames = $requestedMeasurements->pluck('name')->all();

        if (!empty($requestedNames)) {
            $order->order_measurements()
                ->whereNull('measurement_value')
                ->whereNotIn('measurement_name', $requestedNames)
                ->delete();
        }

        foreach ($requestedMeasurements as $measurement) {
            $orderMeasurement = OrderMeasurement::firstOrNew([
                'order_id' => $order->id,
                'measurement_name' => $measurement['name'],
            ]);

            $orderMeasurement->unit = $validated['measurement_unit'];

            if (! $orderMeasurement->exists) {
                $orderMeasurement->measurement_value = null;
            }

            $orderMeasurement->save();
        }

        $order->load('order_measurements');

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

    /**
     * Display all orders for the authenticated shop with search, status, and sort filtering.
     */
    public function ordersIndex(Request $request, $shopId = null)
    {
        $userId = Auth::id();
        
        // If no shopId provided, redirect to the shop's orders page
        if (!$shopId) {
            $shop = TailoringShop::where('user_id', $userId)->first();
            if ($shop) {
                return redirect()->route('store.orders.page', ['shopId' => $shop->id]);
            }
            return redirect()->route('store.dashboard');
        }

        // Verify the shop belongs to the authenticated user
        $shop = TailoringShop::with(['attributes.attributeCategory'])->findOrFail($shopId);
        if ($shop->user_id !== $userId) {
            abort(403, 'Unauthorized. You can only view orders for your own shop.');
        }

        // Build the base query
        $query = Order::where('tailoring_shop_id', $shopId)
            ->with([
                'user.profile',
                'customer',
                'service.serviceCategory',
                'items.shopAttribute.attributeType.attributeCategory',
                'tailoringShop',
                'latestLog.user:id,name,role',
            ]);

        // Apply Status Filter if provided
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Apply Search Filter (Searching Order ID or User Name)
        if ($request->filled('search')) {
            $searchTerm = '%' . $request->search . '%';
            $query->where(function ($q) use ($searchTerm) {
                $q->where('id', 'like', $searchTerm)
                  ->orWhereHas('user', function ($subQ) use ($searchTerm) {
                      $subQ->where('name', 'like', $searchTerm);
                  });
            });
        }

        // --- SMART SEARCH RELEVANCE RANKING ---
        // If searching, prioritize exact matches first, then "starts with", then everything else.
        if ($request->filled('search')) {
            $cleanSearch = trim((string) $request->search);
            $startsWith = $cleanSearch . '%';

            $query->orderByRaw(
                "
                    CASE
                        WHEN orders.id = ? THEN 1
                        WHEN EXISTS (
                            SELECT 1
                            FROM users
                            WHERE users.id = orders.user_id
                              AND users.name = ?
                        ) THEN 2
                        WHEN EXISTS (
                            SELECT 1
                            FROM users
                            WHERE users.id = orders.user_id
                              AND users.name LIKE ?
                        ) THEN 3
                        WHEN orders.id LIKE ? THEN 4
                        ELSE 5
                    END ASC
                ",
                [$cleanSearch, $cleanSearch, $startsWith, $startsWith]
            );
        }

        // Apply Sorting (server-side only)
        $sort = $request->input('sort', 'newest');

        // Only apply default Rush priority if they specifically want "Newest" and aren't searching
        if ($sort === 'newest' && ! $request->filled('search')) {
            $query->orderByRaw('(is_rush = 1 OR expected_completion_date <= NOW() + INTERVAL 2 DAY) DESC')
                  ->latest();
        } elseif ($sort === 'oldest') {
            $query->oldest();
        } elseif ($sort === 'due-soon') {
            // Put null dates at the bottom, sort closest dates to the top
            $query->orderByRaw('expected_completion_date IS NULL ASC')
                  ->orderBy('expected_completion_date', 'asc');
        } elseif ($sort === 'price-high') {
            $query->orderBy('total_price', 'desc');
        } elseif ($sort === 'price-low') {
            $query->orderByRaw('total_price IS NULL ASC')
                  ->orderBy('total_price', 'asc');
        } else {
            $query->latest(); // Fallback
        }

        // Paginate with query string parameters preserved
        $orders = $query->paginate(10)->withQueryString();

        return Inertia::render('StoreAdmin/OrdersPage', [
            'shopId' => $shopId,
            'shop' => $shop,
            'orders' => $orders,
            'filters' => $request->only(['search', 'status', 'sort']),
        ]);
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


