<?php

namespace App\Http\Controllers\Api;

use Carbon\CarbonPeriod;
use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Holiday;
use App\Models\TailoringShop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AvailabilityController extends Controller
{
    public function getMonthlyAvailability(Request $request, TailoringShop $shop): JsonResponse
    {
        $userId = auth('sanctum')->id();

        $month = (int) $request->integer('month', now()->month);
        $year = (int) $request->integer('year', now()->year);
        $request->validate([
            'month' => 'nullable|integer|min:1|max:12',
            'year' => 'nullable|integer|min:2020|max:2100',
        ]);
        $monthStart = Carbon::create($year, $month, 1)->startOfDay();
        $monthEnd = $monthStart->copy()->endOfMonth();
        $period = CarbonPeriod::create($monthStart, '1 day', $monthEnd);

        $shop->loadMissing('schedules');
        $schedules = $shop->schedules->keyBy('day_of_week');

        $exceptions = $shop->exceptions()
            ->whereMonth('date', $month)
            ->whereYear('date', $year)
            ->get()
            ->keyBy(function ($item) {
                return Carbon::parse($item->date)->format('Y-m-d');
            });

        $holidays = Holiday::whereMonth('date', $month)
            ->whereYear('date', $year)  
            ->pluck('date')
            ->map(function ($date) {
                return Carbon::parse($date)->format('Y-m-d');
            })
            ->toArray();

        $holidayLookup = array_flip($holidays);

        $appointments = Appointment::where('shop_id', $shop->id)
            ->whereNotIn('status', ['Cancelled', 'Declined'])
            ->whereBetween('date', [$monthStart->toDateString(), $monthEnd->toDateString()])
            ->get()
            ->groupBy([
                function ($item) {
                    return Carbon::parse($item->date)->format('Y-m-d');
                },
                function ($item) {
                    return Carbon::parse($item->time_start)->format('H:i');
                },
            ]);

        $availability = [];
        $slotDurationMinutes = (int) ($shop->slot_duration_minutes ?: 30);
        $maxBookingsPerSlot = (int) ($shop->max_bookings_per_slot ?: 3);
        $maxUserBookingsPerSlot = (int) ($shop->max_user_bookings_per_slot ?: 3);

        foreach ($period as $date) {
            $dateKey = $date->format('Y-m-d');
            $availability[$dateKey] = ['slots' => []];

            $openTime = null;
            $closeTime = null;

            // Rule A: Date exception has top priority.
            if ($exceptions->has($dateKey)) {
                $exception = $exceptions->get($dateKey);

                if ($exception->is_closed) {
                    continue;
                }

                if (empty($exception->open_time) || empty($exception->close_time)) {
                    continue;
                }

                $openTime = Carbon::parse($dateKey . ' ' . $exception->open_time);
                $closeTime = Carbon::parse($dateKey . ' ' . $exception->close_time);
            } elseif (isset($holidayLookup[$dateKey])) {
                // Rule B: National holiday closes the shop when no override exists.
                continue;
            } else {
                // Rule C: Fall back to weekly schedule.
                $dayOfWeek = (int) $date->dayOfWeek;
                $schedule = $schedules->get($dayOfWeek);

                if (! $schedule || ! $schedule->is_open || empty($schedule->open_time) || empty($schedule->close_time)) {
                    continue;
                }

                $openTime = Carbon::parse($dateKey . ' ' . $schedule->open_time);
                $closeTime = Carbon::parse($dateKey . ' ' . $schedule->close_time);
            }

            if (! $openTime || ! $closeTime || $openTime->gte($closeTime)) {
                continue;
            }

            $currentSlot = $openTime->copy();

            while (true) {
                $slotEnd = $currentSlot->copy()->addMinutes($slotDurationMinutes);

                if ($slotEnd->gt($closeTime)) {
                    break;
                }

                $slotTime = $currentSlot->format('H:i');
                $slotAppointments = isset($appointments[$dateKey]) && isset($appointments[$dateKey][$slotTime])
                    ? $appointments[$dateKey][$slotTime]
                    : collect();
                $bookingCount = $slotAppointments->count();
                $slotsLeft = max($maxBookingsPerSlot - $bookingCount, 0);
                $userBookingCount = $userId ? $slotAppointments->where('user_id', $userId)->count() : 0;
                $isAvailable = $slotsLeft > 0 && $userBookingCount < $maxUserBookingsPerSlot;

                $availability[$dateKey]['slots'][] = [
                    'time' => $slotTime,
                    'booked_count' => $bookingCount,
                    'slots_left' => $slotsLeft,
                    'max_bookings' => $maxBookingsPerSlot,
                    'max_user_bookings' => $maxUserBookingsPerSlot,
                    'user_booking_count' => $userBookingCount,
                    'is_available' => $isAvailable,
                ];

                $currentSlot->addMinutes($slotDurationMinutes);
            }
        }

        return response()->json($availability);
    }
}