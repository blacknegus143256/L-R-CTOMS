<?php

namespace App\Http\Controllers\StoreAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function show(Request $request): Response
    {
        $shop = $request->user()->tailoringShop;

        if ($shop) {
            $shop->loadCount([
                'services',
                'attributes as inventory_count',
                'schedules',
            ]);
        }

        return Inertia::render('StoreAdmin/OnboardingWizard', [
            'shop' => $shop,
        ]);
    }

    public function updateProfile(Request $request): RedirectResponse
    {
        $shop = $request->user()->tailoringShop;

        if (! $shop) {
            return redirect()->route('store.onboarding')->with('error', 'No shop profile found for this account.');
        }

        $validated = $request->validate([
            'contact_person' => ['required', 'string'],
            'contact_number' => ['required', 'string', 'regex:/^09[0-9]{9}$/'],
            'street' => ['required', 'string'],
            'location_details' => ['nullable', 'string', 'max:1000'],
            'barangay' => ['required', 'string'],
            'latitude' => ['required', 'numeric'],
            'longitude' => ['required', 'numeric'],
            'google_maps_link' => ['nullable', 'url', 'max:500'],
            'logo' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp,gif', 'max:2048'],
        ], [
            'contact_number.regex' => 'The contact number must be 11 digits and start with 09.',
        ]);

        $user = $request->user();
        $user->update(['name' => $validated['contact_person']]);

        $user->profile()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'phone' => $validated['contact_number'],
                'street' => $validated['street'],
                'location_details' => $validated['location_details'] ?? null,
                'barangay' => $validated['barangay'],
                'latitude' => $validated['latitude'],
                'longitude' => $validated['longitude'],
            ]
        );

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

        return redirect()->route('store.onboarding')->with('success', 'Basic profile saved successfully.');
    }

    public function submit(Request $request): RedirectResponse
    {
        $shop = $request->user()->tailoringShop;

        if (! $shop) {
            return redirect()->route('store.onboarding')->with('error', 'No shop profile found for this account.');
        }

        $validated = $request->validate([
            'document_gov_id' => ['required', 'file', 'mimes:jpg,png,pdf', 'max:5120'],
            'document_bir' => ['required', 'file', 'mimes:jpg,png,pdf', 'max:5120'],
            'document_dti' => ['required', 'file', 'mimes:jpg,png,pdf', 'max:5120'],
            'payout_method' => ['required', 'string'],
            'payout_account' => ['required', 'string', 'max:30'],
            'document_qr_code' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp,gif', 'max:2048'],
            'terms_accepted' => ['accepted'],
        ]);

        $govIdPath = $request->file('document_gov_id')->store('legal_documents', 'local');
        $birPath = $request->file('document_bir')->store('legal_documents', 'local');
        $dtiPath = $request->file('document_dti')->store('legal_documents', 'local');

        $shop->update([
            'document_gov_id' => $govIdPath,
            'document_bir' => $birPath,
            'document_dti' => $dtiPath,
            'payout_method' => $validated['payout_method'],
            'payout_account' => $validated['payout_account'],
            'terms_accepted_at' => now(),
        ]);

        if ($request->hasFile('document_qr_code')) {
            $path = $request->file('document_qr_code')->store('legal_documents', 'public');
            $shop->update(['document_qr_code' => $path]);
        }

        return redirect()->route('store.onboarding')->with('success', 'Legal documents uploaded successfully.');
    }
}
