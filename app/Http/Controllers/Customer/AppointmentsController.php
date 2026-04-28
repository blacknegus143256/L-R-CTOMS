<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Holiday;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AppointmentsController extends Controller
{
    public function index(Request $request)
    {
        $month = (int) $request->integer('month', now()->month);
        $year = (int) $request->integer('year', now()->year);

        // Fetch user appointments with eager loading
        $appointments = Appointment::with(['order.tailoringShop', 'order.service'])
            ->where('user_id', $request->user()->id)
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->orderBy('date')
            ->orderBy('time_start')
            ->get();

        // Group appointments by date
        $appointmentsByDate = $appointments
            ->groupBy(fn ($apt) => Carbon::parse($apt->date)->format('Y-m-d'))
            ->map(fn ($group) => $group->values())
            ->toArray();

        // Fetch global holidays and key by date
        $holidaysByDate = Holiday::whereYear('date', $year)
            ->whereMonth('date', $month)
            ->get()
            ->keyBy(fn ($h) => Carbon::parse($h->date)->format('Y-m-d'))
            ->map(fn ($h) => $h->name)
            ->toArray();

        return Inertia::render('dashboard/Appointments', [
            'appointmentsByDate' => $appointmentsByDate,
            'holidaysByDate' => $holidaysByDate,
            'month' => $month,
            'year' => $year,
        ]);
    }
}
