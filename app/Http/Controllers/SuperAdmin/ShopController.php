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
    public function index(Request $request) {
        $search = trim((string) $request->input('search', ''));
        $filter = (string) $request->input('filter', 'all');

        $requiredDocumentTypes = ['gov_id', 'bir_2303', 'dti_permit'];
        $hasAllRequiredDocuments = function ($query) use ($requiredDocumentTypes) {
            foreach ($requiredDocumentTypes as $documentType) {
                $query->whereHas('documents', function ($documentsQuery) use ($documentType) {
                    $documentsQuery->where('document_type', $documentType)
                        ->whereNotNull('file_path');
                });
            }
        };

        $baseQuery = TailoringShop::query()->with(['user.profile']);

        $stats = [
            'all' => (clone $baseQuery)->count(),
            'complete' => (clone $baseQuery)->where($hasAllRequiredDocuments)->count(),
            'missing' => (clone $baseQuery)->where(function ($query) use ($hasAllRequiredDocuments) {
                $query->whereDoesntHave('documents', function ($documentsQuery) {
                    $documentsQuery->where('document_type', 'gov_id')
                        ->whereNotNull('file_path');
                })->orWhereDoesntHave('documents', function ($documentsQuery) {
                    $documentsQuery->where('document_type', 'bir_2303')
                        ->whereNotNull('file_path');
                })->orWhereDoesntHave('documents', function ($documentsQuery) {
                    $documentsQuery->where('document_type', 'dti_permit')
                        ->whereNotNull('file_path');
                });
            })->count(),
        ];

        $query = TailoringShop::query()
            ->select('tailoring_shops.*')
            ->with(['user.profile']);

        if ($filter === 'complete') {
            $query->where($hasAllRequiredDocuments);
        } elseif ($filter === 'missing') {
            $query->where(function ($where) {
                $where->whereDoesntHave('documents', function ($documentsQuery) {
                    $documentsQuery->where('document_type', 'gov_id')
                        ->whereNotNull('file_path');
                })->orWhereDoesntHave('documents', function ($documentsQuery) {
                    $documentsQuery->where('document_type', 'bir_2303')
                        ->whereNotNull('file_path');
                })->orWhereDoesntHave('documents', function ($documentsQuery) {
                    $documentsQuery->where('document_type', 'dti_permit')
                        ->whereNotNull('file_path');
                });
            });
        }

        if ($search !== '') {
            $escapedSearch = addcslashes($search, '%_\\');
            $like = '%' . $escapedSearch . '%';
            $startsWith = $escapedSearch . '%';

            $query->leftJoin('users as owners', 'tailoring_shops.user_id', '=', 'owners.id')
                ->where(function ($where) use ($like) {
                    $where->where('tailoring_shops.shop_name', 'like', $like)
                        ->orWhere('owners.name', 'like', $like)
                        ->orWhere('owners.email', 'like', $like);
                })
                ->orderByRaw(
                    'CASE
                        WHEN LOWER(tailoring_shops.shop_name) = LOWER(?)
                            OR LOWER(COALESCE(owners.name, "")) = LOWER(?)
                            OR LOWER(COALESCE(owners.email, "")) = LOWER(?) THEN 0
                        WHEN LOWER(tailoring_shops.shop_name) LIKE LOWER(?)
                            OR LOWER(COALESCE(owners.name, "")) LIKE LOWER(?)
                            OR LOWER(COALESCE(owners.email, "")) LIKE LOWER(?) THEN 1
                        ELSE 2
                    END',
                    [$search, $search, $search, $startsWith, $startsWith, $startsWith]
                )
                ->orderByDesc('tailoring_shops.updated_at');
        } else {
            $query->latest('tailoring_shops.updated_at');
        }

        $shops = $query->paginate(10)->withQueryString();

        return Inertia::render('SuperAdmin/ShopList', [
            'shops' => $shops,
            'stats' => $stats,
            'filters' => [
                'search' => $search,
                'filter' => $filter,
            ],
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