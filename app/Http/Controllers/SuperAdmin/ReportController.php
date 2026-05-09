<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Report::class);

        $reports = Report::with(['reporter', 'reported', 'order'])
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('SuperAdmin/Reports', [
            'reports' => $reports,
        ]);
    }

    public function resolve(Report $report)
    {
        $this->authorize('update', $report);

        $report->update(['status' => 'resolved']);

        Log::info('Report resolved', [
            'report_id' => $report->id,
            'by' => Auth::id(),
        ]);

        return back()->with('success', 'Report marked as resolved.');
    }

    public function dismiss(Report $report)
    {
        $this->authorize('update', $report);

        $report->update(['status' => 'dismissed']);

        Log::info('Report dismissed', [
            'report_id' => $report->id,
            'by' => Auth::id(),
        ]);

        return back()->with('success', 'Report dismissed.');
    }

    public function investigate(Report $report)
    {
        $this->authorize('update', $report);

        $report->update(['status' => 'investigating']);

        Log::info('Report marked for investigation', [
            'report_id' => $report->id,
            'by' => Auth::id(),
        ]);

        return back()->with('success', 'Report marked as under investigation.');
    }
}
