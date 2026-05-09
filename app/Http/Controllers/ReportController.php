<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Report;
use App\Models\TailoringShop;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'reported_id' => ['required', 'exists:users,id'],
            'shop_id' => ['nullable', 'exists:tailoring_shops,id'],
            'order_id' => ['nullable', 'exists:orders,id'],
            'reason' => ['required', 'string', 'max:255'],
            'details' => ['nullable', 'string', 'max:2000'],
        ]);

        $report = Report::create(array_merge($data, [
            'reporter_id' => Auth::id(),
            'status' => 'pending',
        ]));

        Log::info('Report created', ['report_id' => $report->id, 'reporter' => Auth::id()]);

        return back()->with('success', 'Thank you. Our team will review this report.');
    }

    public function index(Request $request)
    {
        $this->authorize('viewAny', Report::class);

        $reports = Report::with(['reporter:id,name', 'reported:id,name', 'order'])
            ->orderBy('created_at','desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('SuperAdmin/Reports', [
            'reports' => $reports,
        ]);
    }

    public function resolve(Report $report)
    {
        $this->authorize('update', $report);

        $report->status = 'resolved';
        $report->save();

        Log::info('Report resolved', ['report_id' => $report->id, 'by' => Auth::id()]);

        return redirect()->back();
    }

    public function dismiss(Report $report)
    {
        $this->authorize('update', $report);

        $report->status = 'dismissed';
        $report->save();

        Log::info('Report dismissed', ['report_id' => $report->id, 'by' => Auth::id()]);

        return redirect()->back();
    }
}
