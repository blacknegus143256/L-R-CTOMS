<?php

namespace App\Http\Controllers\StoreAdmin;

use App\Http\Controllers\Controller;
use App\Models\ShopDocument;
use App\Models\ShopStatus;
use App\Models\User;
use App\Notifications\ShopDocumentsResubmitted;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function show(Request $request): Response
    {

        $shop = $request->user()->tailoringShop;

        if ($shop) {
            $shop->load([
                'schedules:id,shop_id,day_of_week,is_open,open_time,close_time',
                'documents',
            ]);
            $shop->loadCount([
                'services',
                'attributes as inventory_count',
                'schedules',
            ]);

            $shop->active_inventory_categories_count = $shop->attributes()
                ->select('attribute_types.attribute_category_id')
                ->distinct()
                ->count('attribute_types.attribute_category_id');
        }

        return Inertia::render('StoreAdmin/OnboardingWizard', [
            'shop' => $shop,
        ]);

    }

    public function updateProfile(Request $request): RedirectResponse
    {
        $shop = $request->user()->tailoringShop;

        // If the user doesn't yet have a tailoring shop record (possible if created before), create one now
        if (! $shop) {
            $defaultStatusId = ShopStatus::where('name', 'Pending')->value('id') ?? 1;
            $shop = $request->user()->tailoringShops()->create([
                'shop_name' => $request->user()->name,
                'contact_person' => $request->user()->name,
                'contact_role' => 'Owner',
                'shop_status_id' => $defaultStatusId,
                'is_active' => false,
            ]);
        }

        $validated = $request->validate([
            'contact_person' => ['required', 'string'],
            'contact_number' => ['required', 'string', 'regex:/^09[0-9]{9}$/'],
            'street' => ['required', 'string'],
            'location_details' => ['nullable', 'string', 'max:1000'],
            'barangay' => ['required', 'string'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'google_maps_link' => ['nullable', 'url', 'max:500'],
            'logo' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp,gif', 'max:5048'],
        ], [
            'contact_number.regex' => 'The contact number must be 11 digits and start with 09.',
        ]);

        $user = $request->user();
        $user->update(['name' => $validated['contact_person']]);

        // Fetch the existing profile, or create a new instance attached to the user
        $profile = $user->profile()->first() ?? $user->profile()->make();

        // Manually map and assign the properties (bypasses $fillable entirely)
        $profile->phone = $validated['contact_number'];
        $profile->street = $validated['street'];
        $profile->location_details = $validated['location_details'] ?? null;
        $profile->barangay = $validated['barangay'];
        $profile->latitude = $validated['latitude'] ?? null;
        $profile->longitude = $validated['longitude'] ?? null;

        // Force the database save
        $profile->save();

        $shop = $request->user()->tailoringShop;

        if ($request->hasFile('logo') && $shop) {
            if ($shop->logo_url && Storage::disk('public')->exists($shop->logo_url)) {
                Storage::disk('public')->delete($shop->logo_url);
            }

            $path = $request->file('logo')->store('shop_logos', 'public');
            $shop->update(['logo_url' => $path]);
        }

        if ($shop) {
            $shop->update([
                'google_maps_link' => $validated['google_maps_link'] ?? null,
            ]);
        }

        return redirect()->route('store.onboarding', ['startStep' => 2])
                 ->with('success', 'Basic profile saved successfully.');
    }

    public function submit(Request $request): RedirectResponse
    {
        $shop = $request->user()->tailoringShop;

        if (! $shop) {
            return redirect()->route('store.onboarding')->with('error', 'No shop profile found for this account.');
        }
        
            \Illuminate\Support\Facades\Log::error('=== ONBOARDING SUBMIT TRIGGERED ===');
        \Illuminate\Support\Facades\Log::error('Gov ID File Present? : ' . ($request->hasFile('document_gov_id') ? 'YES' : 'NO'));
        \Illuminate\Support\Facades\Log::error('BIR File Present? : ' . ($request->hasFile('document_bir') ? 'YES' : 'NO'));
        \Illuminate\Support\Facades\Log::error('DTI File Present? : ' . ($request->hasFile('document_dti') ? 'YES' : 'NO'));
        \Illuminate\Support\Facades\Log::error('Request Data: ', $request->except(['document_gov_id', 'document_bir', 'document_dti']));

        $validated = $request->validate([
            'document_gov_id' => ['nullable', 'file', 'mimes:jpg,png,pdf', 'max:5120'],
            'document_bir' => ['nullable', 'file', 'mimes:jpg,png,pdf', 'max:5120'],
            'document_dti' => ['nullable', 'file', 'mimes:jpg,png,pdf', 'max:5120'],
            'payout_method' => ['required', 'string'],
            'payout_account' => ['required', 'string', 'max:30'],
            'document_qr_code' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp,gif', 'max:5048'],
            'nda_accepted' => ['accepted'],
        ]);

        $wasRejected = $shop->status === 'rejected';
        $resubmittedDocuments = [];

        $documentMap = [
            'document_gov_id' => ['type' => 'gov_id'],
            'document_bir' => ['type' => 'bir_2303'],
            'document_dti' => ['type' => 'dti_permit'],
        ];

        $hasDocumentUpdates = false;

        Log::error('OnboardingController@submit document upload start', [
            'shop_id' => $shop->id,
            'has_gov_id' => $request->hasFile('document_gov_id') ? 'YES' : 'NO',
            'has_bir' => $request->hasFile('document_bir') ? 'YES' : 'NO',
            'has_dti' => $request->hasFile('document_dti') ? 'YES' : 'NO',
        ]);

        foreach ($documentMap as $inputKey => $meta) {
            if (! $request->hasFile($inputKey)) {
                continue;
            }

            Log::error('OnboardingController@submit processing document', [
                'shop_id' => $shop->id,
                'inputKey' => $inputKey,
                'original' => $request->file($inputKey)?->getClientOriginalName(),
                'mime' => $request->file($inputKey)?->getClientMimeType(),
                'size' => $request->file($inputKey)?->getSize(),
            ]);


            $hasDocumentUpdates = true;
            $document = $shop->documents()->where('document_type', $meta['type'])->first();

            // Track which documents are being resubmitted (were previously rejected)
            if ($document?->status === 'rejected') {
                $resubmittedDocuments[] = $inputKey;
            }

            if ($document?->file_path && Storage::disk('local')->exists($document->file_path)) {
                Storage::disk('local')->delete($document->file_path);
            }

            $storedPath = $request->file($inputKey)->store('legal_documents', 'local');

            ShopDocument::updateOrCreate(
                [
                    'shop_id' => $shop->id,
                    'document_type' => $meta['type'],
                ],
                [
                    'file_path' => $storedPath,
                    'status' => 'pending',
                    'rejection_reason' => null,
                ]
            );
        }

        if (! $hasDocumentUpdates) {
            return back()->withErrors([
                'document_gov_id' => 'Upload at least one document to submit changes.',
            ]);
        }

        $defaultStatusId = ShopStatus::where('name', 'Pending')->value('id') ?? 1;

        $shop->update(array_merge([
            'payout_method' => $validated['payout_method'],
            'payout_account' => $validated['payout_account'],
            'terms_accepted_at' => now(),
            'nda_accepted_at' => now(),
        ], ['shop_status_id' => $defaultStatusId]));

        // Log resulting shop_documents after upload attempt
        $shop->loadMissing('documents');
        Log::error('OnboardingController@submit documents after upload', [
            'shop_id' => $shop->id,
            'documents' => $shop->documents
                ->map(fn($d) => [
                    'id' => $d->id,
                    'document_type' => $d->document_type,
                    'file_path' => $d->file_path,
                    'status' => $d->status,
                    'rejection_reason' => $d->rejection_reason,
                ])
                ->values(),
        ]);

        if ($request->hasFile('document_qr_code')) {
            $path = $request->file('document_qr_code')->store('legal_documents', 'public');
            $shop->update(['document_qr_code' => $path]);
        }

        // If this is a resubmission after rejection, notify super-admin users
        if ($wasRejected) {
            $superAdminUsers = User::where('role', 'super-admin')->get();
            Notification::send($superAdminUsers, new ShopDocumentsResubmitted($shop, null, $resubmittedDocuments));
        }

        return redirect()->route('store.onboarding', ['startStep' => 3])
                 ->with('success', 'Legal documents uploaded successfully.');
    }
}
