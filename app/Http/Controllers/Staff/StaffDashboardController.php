<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AttributeCategory;
use App\Models\Holiday;
use App\Models\Order;
use App\Models\TailoringShop;
use App\Models\UserMeasurement;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StaffDashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $shop = $this->resolveStaffShop($user);

        if (! $shop) {
            return Inertia::render('Staff/WelcomeToTeam', [
                'message' => 'Welcome to the team! You currently are not assigned to any active tailor shops. Please wait for an invitation or contact your shop owner.',
            ]);
        }

        $assignedOrders = Order::whereHas('assignments', function ($query) use ($user) {
                $query->where('users.id', $user->id);
            })
            ->with(['customer:id,name', 'status:id,name', 'assignments:id,name,email'])
            ->get();

        $activeAssignedOrders = $assignedOrders
            ->filter(function (Order $order) {
                $status = $order->status;

                if ($status instanceof \BackedEnum) {
                    $status = $status->value;
                } elseif ($status instanceof \UnitEnum) {
                    $status = $status->name;
                } elseif (is_object($status)) {
                    $status = $status->name ?? $status->value ?? '';
                }

                return ! in_array(trim((string) $status), ['Completed', 'Cancelled', 'Rejected', 'Declined'], true);
            })
            ->count();

        $ordersDueSoon = $assignedOrders
            ->filter(function (Order $order) {
                if (! $order->expected_completion_date) {
                    return false;
                }

                $status = $order->status;
                if ($status instanceof \BackedEnum) {
                    $status = $status->value;
                } elseif ($status instanceof \UnitEnum) {
                    $status = $status->name;
                } elseif (is_object($status)) {
                    $status = $status->name ?? $status->value ?? '';
                }

                if (in_array(trim((string) $status), ['Completed', 'Cancelled', 'Rejected', 'Declined'], true)) {
                    return false;
                }

                return Carbon::parse($order->expected_completion_date)->lessThanOrEqualTo(now()->addDays(2));
            })
            ->count();

        $todaysAppointments = Appointment::whereDate('date', now()->toDateString())
            ->whereHas('order.assignments', function ($query) use ($user) {
                $query->where('users.id', $user->id);
            })
            ->count();

        return Inertia::render('Staff/Dashboard', [
            'shop' => $shop,
            'orders' => $assignedOrders,
            'summary' => [
                'activeAssignedOrders' => $activeAssignedOrders,
                'ordersDueSoon' => $ordersDueSoon,
                'todaysAppointments' => $todaysAppointments,
            ],
        ]);
    }

    public function show(Request $request, Order $order)
    {
        $this->authorize('view', $order);

        $shop = $order->tailoringShop;

        $order->load([
            'customer.profile',
            'customer:id,name,email',
            'service:id,service_name,price,service_description,checkout_type',
            'service.serviceCategory:id,name',
            'fitMethod',
            'appointments',
            'items.shopAttribute.attributeType.attributeCategory',
            'images',
            'order_measurements',
            'reworkRequest',
            'logs.user:id,name,role',
        ]);

        $shop->load([
            'attributes' => function ($query) {
                $query->withPivot('price', 'item_name', 'image_url', 'notes', 'unit');
            },
            'attributes.attributeCategory',
        ]);

        $categories = AttributeCategory::orderBy('name')->get(['id', 'name']);

        $customerId = $order->user_id ?? $order->customer_id;
        $globalMeasurements = [];

        if ($customerId) {
            try {
                $globalMeasurements = UserMeasurement::where('user_id', $customerId)
                    ->get(['measurement_name', 'value', 'unit', 'last_verified_at'])
                    ->mapWithKeys(fn ($measurement) => [
                        $measurement->measurement_name => [
                            'value' => $measurement->value,
                            'unit' => $measurement->unit,
                            'lastVerified' => $measurement->last_verified_at,
                        ],
                    ])
                    ->toArray();
            } catch (\Exception $exception) {
                $globalMeasurements = [];
                Log::warning('Failed to fetch global measurements for staff order workspace', [
                    'user_id' => $customerId,
                    'error' => $exception->getMessage(),
                ]);
            }
        }

        return Inertia::render('dashboard/TailorOrderWorkspace', [
            'order' => $order,
            'shop' => $shop,
            'categories' => $categories,
            'globalMeasurements' => $globalMeasurements,
            'staffMembers' => [],
            'canManageFinancials' => false,
        ]);
    }

    public function orders(Request $request)
    {
        $user = $request->user();
        $shop = $this->resolveStaffShop($user);

        if (! $shop) {
            return redirect()->route('staff.dashboard');
        }

        $ordersQuery = Order::whereHas('assignments', function ($query) use ($user) {
                $query->where('users.id', $user->id);
            })
            ->with(['customer:id,name', 'status:id,name', 'assignments:id,name,email']);

        if ($search = $request->input('search')) {
            $ordersQuery->where(function ($q) use ($search) {
                $q->whereHas('customer', fn ($sq) => $sq->where('name', 'like', "%$search%"))
                  ->orWhere('order_number', 'like', "%$search%");
            });
        }

        $orders = $ordersQuery->orderBy('created_at', 'desc')->get();

        return Inertia::render('StoreAdmin/OrdersPage', [
            'shop' => $shop,
            'orders' => $orders,
            'isStaffRoute' => true,
            'canAssignStaff' => false,
        ]);
    }

    public function appointments(Request $request)
    {
        $user = $request->user();
        $shop = $this->resolveStaffShop($user);

        if (! $shop) {
            return redirect()->route('staff.dashboard');
        }

        $month = (int) $request->integer('month', now()->month);
        $year = (int) $request->integer('year', now()->year);

        $appointments = Appointment::with(['user', 'order.service', 'order.status'])
            ->where('shop_id', $shop->id)
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->whereHas('order.assignments', function ($query) use ($user) {
                $query->where('users.id', $user->id);
            })
            ->orderBy('date')
            ->orderBy('time_start')
            ->get();

        $exceptions = $shop->exceptions()
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->get()
            ->keyBy(fn ($exception) => Carbon::parse($exception->date)->format('Y-m-d'));

        $holidays = Holiday::query()
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->get()
            ->keyBy(fn ($holiday) => Carbon::parse($holiday->date)->format('Y-m-d'))
            ->map->reason;

        $appointmentsByDate = $appointments
            ->groupBy(fn ($appointment) => Carbon::parse($appointment->date)->format('Y-m-d'))
            ->map(fn ($group) => $group->values())
            ->toArray();

        $shop->load(['schedules', 'exceptions']);

        return Inertia::render('Shop/Appointments', [
            'auth' => ['user' => $user],
            'shop' => $shop,
            'month' => $month,
            'year' => $year,
            'appointmentsByDate' => $appointmentsByDate,
            'exceptionsByDate' => $exceptions->toArray(),
            'holidaysByDate' => $holidays->toArray(),
            'canManageSchedule' => false,
            'appointmentsRoute' => route('staff.appointments'),
        ]);
    }

    private function resolveStaffShop($user): ?TailoringShop
    {
        return $user->workplaces()
            ->wherePivot('is_active', true)
            ->select('tailoring_shops.*')
            ->with(['shopStatus'])
            ->first();
    }
}
