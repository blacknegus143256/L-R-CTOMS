<?php 

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\TailoringShop;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ShopController extends Controller {
    public function index() {
        return Inertia::render('SuperAdmin/ShopList', [
            'shops' => TailoringShop::with(['user.profile'])->latest()->get()
        ]);
    }

    public function document(TailoringShop $shop, string $type): BinaryFileResponse
    {
        $columnMap = [
            'gov-id' => 'document_gov_id',
            'bir' => 'document_bir',
            'dti' => 'document_dti',
        ];

        $column = $columnMap[$type] ?? null;

        if (! $column) {
            abort(404, 'Invalid document type.');
        }

        $path = $shop->{$column};

        if (! $path || ! Storage::disk('local')->exists($path)) {
            abort(404, 'Document not found.');
        }

        return response()->file(Storage::disk('local')->path($path), [
            'Cache-Control' => 'no-cache',
        ]);
    }

    public function reject(Request $request, TailoringShop $shop): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $shop->update([
            'status' => 'rejected',
            'rejection_reason' => $validated['reason'],
        ]);

        return redirect()->back()->with('message', 'Shop rejected successfully!');
    }
}