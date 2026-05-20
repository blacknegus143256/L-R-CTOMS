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
use App\Models\User;
use App\Models\UserMeasurement;
use App\Notifications\OrderUpdatedNotification;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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

        $totalRevenue = $this->calculateCompletedRevenue(
            Order::where('tailoring_shop_id', $shop->id)
                ->whereHas('status', function ($query) {
                    $query->where('name', 'Completed');
                })
        );

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
        $currentRevenue = $this->calculateCompletedRevenue(
            Order::where('tailoring_shop_id', $shop->id)
                ->whereHas('status', function ($query) {
                    $query->where('name', 'Completed');
                })
                ->where('created_at', '>=', $currentMonth)
        );

        $lastRevenue = $this->calculateCompletedRevenue(
            Order::where('tailoring_shop_id', $shop->id)
                ->whereHas('status', function ($query) {
                    $query->where('name', 'Completed');
                })
                ->where('created_at', '>=', $lastMonthStart)
                ->where('created_at', '<', $lastMonthEnd)
        );
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
            })
            ->with(['orderServices', 'items']);

        $orders = match ($granularity) {
            'monthly' => (clone $baseQuery)
                ->where('created_at', '>=', now()->subMonths(11)->startOfMonth())
                ->get(),
            'yearly' => (clone $baseQuery)
                ->where('created_at', '>=', now()->subYears(4)->startOfYear())
                ->get(),
            default => (clone $baseQuery)
                ->where('created_at', '>=', now()->subDays(30))
                ->get(),
        };

        $periodResolver = match ($granularity) {
            'monthly' => fn (Order $order) => $order->created_at->format('Y-m-01'),
            'yearly' => fn (Order $order) => $order->created_at->format('Y'),
            default => fn (Order $order) => $order->created_at->format('Y-m-d'),
        };

        $labelResolver = match ($granularity) {
            'monthly' => fn (string $period) => Carbon::parse($period)->format('M Y'),
            'yearly' => fn (string $period) => $period,
            default => fn (string $period) => Carbon::parse($period)->format('M d'),
        };

        $data = $orders
            ->groupBy(fn (Order $order) => $periodResolver($order))
            ->sortKeys()
            ->map(function ($group, string $period) use ($labelResolver) {
                return [
                    'period' => $period,
                    'label' => $labelResolver($period),
                    'total' => (float) $group->sum(fn (Order $order) => (float) $order->total_price),
                ];
            })
            ->values();

        return response()->json([
            'granularity' => $granularity,
            'revenue' => $data
        ]);
    }

    private function calculateCompletedRevenue(Builder $query): float
    {
        return (float) $query
            ->with(['orderServices', 'items'])
            ->get()
            ->sum(fn (Order $order) => (float) $order->total_price);
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
                    // Accept value if the tailor provided it during quoting/fitting
                    'value' => array_key_exists('value', $field) ? $field['value'] : null,
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

        $hasAnyValues = false;
        foreach ($requestedMeasurements as $measurement) {
            $orderMeasurement = $order->order_measurements()->firstOrNew([
                'measurement_name' => $measurement['name'],
            ]);

            // 1. THE MISSING LINK: Actually save the typed number!
            if (isset($measurement['value']) && $measurement['value'] !== '') {
                $orderMeasurement->measurement_value = (string) $measurement['value'];
                $hasAnyValues = true;
            } else {
                if (! $orderMeasurement->exists) {
                    $orderMeasurement->measurement_value = null;
                }
            }

            $orderMeasurement->unit = $validated['measurement_unit'] ?? ($measurement['unit'] ?? 'in');
            $orderMeasurement->save();

            // 2. PHASE 2 SYNC: Save to the Customer's Global Profile
            if (isset($measurement['value']) && $measurement['value'] !== '') {
                $customerId = $order->user_id ?? $order->customer_id ?? ($order->user?->id ?? null);
                if ($customerId) {
                    UserMeasurement::updateOrCreate(
                        [
                            'user_id' => $customerId,
                            'measurement_name' => $measurement['name'],
                        ],
                        [
                            'value' => (float) $measurement['value'],
                            'unit' => $validated['measurement_unit'] ?? ($measurement['unit'] ?? 'in'),
                            'notes' => 'Recorded by tailor during request',
                            'last_verified_at' => now(),
                        ]
                    );
                }
            }
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
                // Build notification message based on fit method
                $fitMethodName = $order->fitMethod?->name ?? $order->fit_method?->name ?? 'measurement';
                if (stripos($fitMethodName, 'In-Shop') !== false) {
                    $notificationMessage = "The tailor recorded in-shop measurements for order #{$order->id}. Please review if they match your requirements.";
                } elseif (stripos($fitMethodName, 'Home Visit') !== false) {
                    $notificationMessage = "The tailor recorded home visit measurements for order #{$order->id}. Please review if they match your requirements.";
                } else {
                    $notificationMessage = "Your tailor requested measurements for order #{$order->id}.";
                }
                
                $order->user->notify(new OrderUpdatedNotification(
                    $order,
                    $notificationMessage,
                    'measurement_requested'
                ));
            }
        }

        // Log the action to the timeline
        $actionDesc = $hasAnyValues 
            ? 'Tailor recorded in-shop measurements.' 
            : 'Tailor requested specific measurements from the customer.';
        $actionType = $hasAnyValues ? 'measurements_recorded' : 'measurements_requested';
        $this->logOrderActivity(
            $order,
            $user?->id,
            $actionType,
            $actionDesc
        );

        return redirect()->route('store.orders.show', $order->id)
            ->with('success', 'Measurement request updated successfully.');
    }

    /**
     * Save in-shop/home visit measurements from the tailor.
     * PATCH /store/orders/{order}/save-measurements
     * 
     * This endpoint allows tailors to input measurements during in-shop or home visit fittings.
     * Measurements are saved to both the order snapshot and the customer's global profile.
     */
    public function saveMeasurements(Request $request, Order $order)
    {
        $user = $request->user();
        $shop = $user->tailoringShops()->first() ?? null;

        if (!$shop || $order->tailoring_shop_id !== $shop->id) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'measurements' => 'required|array',
            'measurements.*.name' => 'required|string',
            'measurements.*.value' => 'required|numeric|min:0',
            'measurements.*.unit' => 'nullable|string|in:in,cm,inches,centimeters',
        ]);

        // Normalize unit format
        $normalizeUnit = function ($unit) {
            if (!$unit) return 'in';
            $unit = strtolower(trim($unit));
            return $unit === 'centimeters' || $unit === 'cm' ? 'cm' : 'in';
        };

        // Update order measurements with values
        foreach ($validated['measurements'] as $measurement) {
            $normalizedUnit = $normalizeUnit($measurement['unit'] ?? null);

            OrderMeasurement::updateOrCreate(
                [
                    'order_id' => $order->id,
                    'measurement_name' => $measurement['name'],
                ],
                [
                    'measurement_value' => (string) $measurement['value'],
                    'unit' => $normalizedUnit,
                ]
            );
        }

        // --- PHASE 2: SYNC TO GLOBAL CUSTOMER PROFILE ---
        if ($order->user) {
            $syncMeasurements = array_map(function ($m) use ($normalizeUnit) {
                return [
                    'name' => $m['name'],
                    'value' => $m['value'],
                    'unit' => $normalizeUnit($m['unit'] ?? null),
                ];
            }, $validated['measurements']);

            $this->syncToUserMeasurements($order->user, $syncMeasurements);
        }

        // Reload order with updated measurements
        $order->load('order_measurements');

        // Mark measurements as taken if this is an in-shop fitting
        if ($order->measurement_type === 'in_shop' || 
            ($order->fitMethod?->name ?? $order->fit_method?->name) === 'In-Shop Fitting') {
            $order->update(['measurements_taken' => true]);
            $this->checkReadyForProduction($order);
        }

        // Notify customer of measurement submission
        if ($order->user) {
            $recentNotification = DB::table('notifications')
                ->where('data->type', 'measurements_recorded')
                ->where('data->order_id', $order->id)
                ->where('created_at', '>=', now()->subMinutes(5))
                ->whereNull('read_at')
                ->exists();

            if (!$recentNotification) {
                $order->user->notify(new OrderUpdatedNotification(
                    $order,
                    "Measurements recorded for your order #{$order->id} during your fitting.",
                    'measurements_recorded'
                ));
            }
        }

        return redirect()->route('store.orders.show', $order->id)
            ->with('success', 'Measurements saved and synced to customer profile.');
    }

    /**
     * Sync measurements from order to the customer's global profile.
     * Updates or creates UserMeasurement records for profile-based sizing.
     */
    private function syncToUserMeasurements(?User $user, array $measurements): void
    {
        if (!$user) {
            return;
        }

        try {
            foreach ($measurements as $measurement) {
                // Skip if no value provided
                if (empty($measurement['value'])) {
                    continue;
                }

                $unit = $measurement['unit'] ?? 'in';
                if (!is_string($unit)) {
                    $unit = 'in';
                }

                UserMeasurement::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'measurement_name' => $measurement['name'],
                    ],
                    [
                        'value' => (float) $measurement['value'],
                        'unit' => $unit,
                        'notes' => 'Recorded by tailor during fitting',
                        'last_verified_at' => now(),
                    ]
                );
            }
        } catch (\Exception $e) {
            // Log but don't fail the fitting if measurements can't be saved to global profile
            Log::warning('Failed to sync measurements from tailor fitting', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Display all orders for the authenticated shop with search, status, and sort filtering.
     */
    public function ordersIndex(Request $request, $shopId = null)
    {
        $userId = Auth::id();
        
        if (!$shopId) {
            $shop = TailoringShop::where('user_id', $userId)->first();
            if ($shop) {
                return redirect()->route('store.orders.page', ['shopId' => $shop->id]);
            }
            return redirect()->route('store.dashboard');
        }

        $shop = TailoringShop::with(['attributes.attributeCategory'])->findOrFail($shopId);
        $isOwner = $shop->user_id === $userId;
        $isStaff = $request->user()?->workplaces()
            ->where('tailoring_shops.id', $shop->id)
            ->wherePivot('is_active', true)
            ->exists();

        if (! $isOwner && ! $isStaff) {
            abort(403, 'Unauthorized. You can only view orders for your own shop or assigned workplace.');
        }

        // ==========================================
        // BULLETPROOF ELOQUENT STATS CALCULATION
        // ==========================================
        // Loads all orders with relationships into memory to calculate global tab numbers.
        // Safely handles status as Enum, String, or Object.
        // Separates from pagination to maintain accuracy across all filters.
        
        $allOrders = Order::where('tailoring_shop_id', $shopId)
            ->forUser($request->user())
            ->with(['status', 'payment']) 
            ->get();

        // Safe status extractor - handles Enum, String, or Object
        $getStatus = function($o): string {
            if (!isset($o->status)) {
                return '';
            }
            
            $status = $o->status;
            
            // Handle BackedEnum (has ->value)
            if ($status instanceof \BackedEnum) {
                return trim((string)$status->value);
            }
            
            // Handle UnitEnum (case-based enum)
            if ($status instanceof \UnitEnum) {
                return trim((string)$status->name);
            }
            
            // Handle objects with 'name' or 'value' property
            if (is_object($status)) {
                return trim((string)($status->name ?? $status->value ?? ''));
            }
            
            // Handle plain strings
            return trim((string)$status);
        };

        // Safe payment status extractor - handles multiple storage formats
        $getPaymentStatus = function($o): string {
            $payStatus = 'Pending';
            
            // Try loading from payment relationship
            if ($o->payment) {
                $ps = $o->payment->payment_status ?? $o->payment->status ?? null;
                
                if ($ps instanceof \BackedEnum) {
                    $payStatus = trim((string)$ps->value);
                } elseif ($ps instanceof \UnitEnum) {
                    $payStatus = trim((string)$ps->name);
                } elseif (is_object($ps)) {
                    $payStatus = trim((string)($ps->name ?? $ps->value ?? 'Pending'));
                } else {
                    $payStatus = trim((string)($ps ?? 'Pending'));
                }
            }
            
            // Fallback to direct payment_status attribute if relationship failed
            if (empty($payStatus) || $payStatus === 'Pending') {
                $payStatus = trim((string)($o->payment_status ?? 'Pending'));
            }
            
            return $payStatus;
        };

        $stats = [
            'all' => $allOrders->count(),
            'requested' => $allOrders->filter(fn($o) => $getStatus($o) === 'Requested')->count(),
            'quoted' => $allOrders->filter(fn($o) => $getStatus($o) === 'Quoted')->count(),
            'confirmed' => $allOrders->filter(fn($o) => $getStatus($o) === 'Confirmed')->count(),
            'pendingPayment' => $allOrders->filter(function($o) use ($getStatus, $getPaymentStatus) {
                // Only "Confirmed" orders can be pending payment
                if ($getStatus($o) !== 'Confirmed') {
                    return false;
                }
                
                // Check if payment is pending or missing
                $payStatus = $getPaymentStatus($o);
                return $payStatus === 'Pending' || empty($payStatus);
            })->count(),
            'readyForProduction' => $allOrders->filter(fn($o) => $getStatus($o) === 'Ready for Production')->count(),
            'inProgress' => $allOrders->filter(fn($o) => in_array($getStatus($o), ['Confirmed', 'Accepted', 'Appointment Scheduled', 'In Progress', 'Ready']))->count(),
            'readyToPickUp' => $allOrders->filter(fn($o) => in_array($getStatus($o), ['Ready for Pickup', 'Ready to Pick Up', 'Ready']))->count(),
            'rush' => $allOrders->filter(fn($o) => (bool) $o->is_rush)->count(),
            'completed' => $allOrders->filter(fn($o) => $getStatus($o) === 'Completed')->count(),
        ];

        // ==========================================
        // BASE QUERY FOR PAGINATED RESULTS
        // ==========================================
        // Eager-loads all necessary relationships for the table view.
        // Filters and sorting applied separately via Eloquent query builder.
        
        $query = Order::where('tailoring_shop_id', $shopId)
            ->forUser($request->user())
            ->with([
                'user.profile',
                'customer',
                'service.serviceCategory',
                'items.shopAttribute.attributeType.attributeCategory',
                'tailoringShop',
                'assignments:id,name,email',
                'latestLog.user:id,name,role',
            ]);

        // ==========================================
        // SMART STATUS FILTERING
        // ==========================================
        // Uses relationship methods (whereHas, whereDoesntHave) to avoid column guessing.
        // All filters defer to relationship chains instead of raw table columns.
        
        if ($request->filled('status') && $request->status !== 'All') {
            $status = $request->status;
            
            if ($status === 'Pending Payment') {
                // Confirmed orders with no payment or payment status = Pending
                $query->whereHas('status', function ($q) {
                    $q->where('name', 'Confirmed');
                })->where(function($q) {
                    $q->whereDoesntHave('payment')
                      ->orWhereHas('payment.status', function($subQ) {
                          $subQ->where('name', 'Pending');
                      });
                });
            } elseif ($status === 'Rush') {
                $query->where('is_rush', true);
            } elseif ($status === 'In Progress') {
                $query->whereHas('status', function ($q) {
                    $q->whereIn('name', ['Confirmed', 'Accepted', 'Appointment Scheduled', 'In Progress', 'Ready']);
                });
            } elseif ($status === 'Ready to Pick Up') {
                $query->whereHas('status', function ($q) {
                    $q->whereIn('name', ['Ready for Pickup', 'Ready to Pick Up', 'Ready']);
                });
            } else {
                // Generic status filter for any other order status
                $query->whereHas('status', function ($statusQuery) use ($status) {
                    $statusQuery->where('name', $status);
                });
            }
        }

        // ==========================================
        // SMART SEARCH
        // ==========================================
        // Prioritizes exact ID matches, then name matches, then partial matches.
        // Uses CASE statement to rank relevance.
        
        if ($request->filled('search')) {
            $searchTerm = '%' . $request->search . '%';
            $cleanSearch = trim((string) $request->search);
            $startsWith = $cleanSearch . '%';

            $query->where(function ($q) use ($searchTerm) {
                $q->where('id', 'like', $searchTerm)
                  ->orWhereHas('user', function ($subQ) use ($searchTerm) {
                      $subQ->where('name', 'like', $searchTerm);
                  });
            });

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

        // ==========================================
        // SORTING
        // ==========================================
        // Supports: newest, oldest, due-soon, price-high, price-low
        
        $sort = $request->input('sort', 'newest');
        $computedOrderTotalSql = <<<SQL
CASE
    WHEN COALESCE(orders.total_amount, 0) > 0 THEN COALESCE(orders.total_amount, 0)
    ELSE (
        COALESCE((
            SELECT SUM(order_services.price * order_services.quantity)
            FROM order_services
            WHERE order_services.order_id = orders.id
        ), 0)
        + COALESCE((
            SELECT SUM(order_items.price * order_items.quantity)
            FROM order_items
            WHERE order_items.order_id = orders.id
        ), 0)
        + COALESCE(orders.rush_fee, 0)
    )
END
SQL;

        if ($sort === 'newest') {
            $query->latest();
        } elseif ($sort === 'oldest') {
            $query->oldest();
        } elseif ($sort === 'due-soon') {
            $query->orderByRaw('expected_completion_date IS NULL ASC')->orderBy('expected_completion_date', 'asc');
        } elseif ($sort === 'price-high') {
            $query->orderByRaw($computedOrderTotalSql . ' DESC');
        } elseif ($sort === 'price-low') {
            $query->orderByRaw($computedOrderTotalSql . ' ASC');
        } else {
            $query->latest();
        }

        $orders = $query->paginate(10)->withQueryString();

        return Inertia::render('StoreAdmin/OrdersPage', [
            'shopId' => $shopId,
            'shop' => $shop,
            'orders' => $orders,
            'stats' => $stats,
            'staffMembers' => $isOwner
                ? $shop->activeStaff()->select('users.id', 'users.name', 'users.email')->orderBy('users.name')->get()
                : [],
            'canAssignStaff' => $isOwner,
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

    private function logOrderActivity(Order $order, ?int $userId, string $action, string $description): void
    {
        // Migration-safe scaffold: no-op until order_logs table exists
        if (!\Illuminate\Support\Facades\Schema::hasTable('order_logs')) {
            return;
        }

        DB::table('order_logs')->insert([
            'order_id' => $order->id,
            'user_id' => $userId,
            'action' => $action,
            'description' => $description,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}


