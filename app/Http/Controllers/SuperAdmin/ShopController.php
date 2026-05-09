<?php 

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\TailoringShop;
use App\Models\ShopStatus;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ShopController extends Controller {
    public function index() {
        return Inertia::render('SuperAdmin/ShopList', [
            'shops' => TailoringShop::with(['user.profile', 'documents'])->latest()->get()
        ]);
    }

    public function document(TailoringShop $shop, string $type): BinaryFileResponse
    {
        $typeMap = [
            'gov-id' => 'gov_id',
            'bir' => 'bir_2303',
            'dti' => 'dti_permit',
        ];

        $documentType = $typeMap[$type] ?? null;

        if (! $documentType) {
            abort(404, 'Invalid document type.');
        }

        $document = $shop->documents()->where('document_type', $documentType)->first();
        $path = $document?->file_path;

        if (! $path || ! Storage::disk('local')->exists($path)) {
            abort(404, 'Document not found.');
        }

        return response()->file(Storage::disk('local')->path($path), [
            'Cache-Control' => 'no-cache',
        ]);
    }

    public function reviewDocument(Request $request, TailoringShop $shop): RedirectResponse
    {
        $validated = $request->validate([
            'document' => ['required', 'in:gov-id,bir,dti'],
            'status' => ['required', 'in:pending,approved,rejected'],
            'reason' => ['nullable', 'string', 'max:500', 'required_if:status,rejected'],
        ]);

        $documentMap = [
            'gov-id' => 'gov_id',
            'bir' => 'bir_2303',
            'dti' => 'dti_permit',
        ];

        $documentType = $documentMap[$validated['document']];
        $document = $shop->documents()->where('document_type', $documentType)->first();

        if (! $document) {
            return redirect()->back()->withErrors([
                'document' => 'Document record not found for this shop.',
            ]);
        }

        $document->update([
            'status' => $validated['status'],
            'rejection_reason' => $validated['status'] === 'rejected' ? $validated['reason'] : null,
        ]);

        if ($validated['status'] === 'rejected') {
            $pendingId = ShopStatus::where('name', 'Pending')->value('id');
            $shop->update(['shop_status_id' => $pendingId]);
            return redirect()->back()->with('message', 'Document review updated successfully.');
        }

        $requiredDocumentTypes = ['gov_id', 'bir_2303', 'dti_permit'];
        $statusesByType = $shop->documents()
            ->whereIn('document_type', $requiredDocumentTypes)
            ->pluck('status', 'document_type');

        $allApproved = collect($requiredDocumentTypes)->every(
            fn (string $type) => ($statusesByType[$type] ?? null) === 'approved'
        );

        if ($allApproved) {
            $approvedId = ShopStatus::where('name', 'Approved')->value('id');
            $shop->update(['shop_status_id' => $approvedId]);
        } else {
            $pendingId = ShopStatus::where('name', 'Pending')->value('id');
            $shop->update(['shop_status_id' => $pendingId]);
        }

        return redirect()->back()->with('message', 'Document review updated successfully.');
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