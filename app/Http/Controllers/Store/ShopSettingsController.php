<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\ShopException;
use App\Models\ShopSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ShopSettingsController extends Controller
{
    public function edit(Request $request)
    {
        $shop = $request->user()->tailoringShop;

        if (!$shop) {
            abort(404, 'Shop not found.');
        }

        $shop->load(['schedules', 'exceptions']);

        return inertia('StoreAdmin/ShopSettings', [
            'shop' => $shop,
        ]);
    }

    public function update(Request $request)
    {
        $shop = $request->user()->tailoringShop;

        if (!$shop) {
            abort(404, 'Shop not found.');
        }

        $validated = $request->validate([
            'logo' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp,gif', 'max:2048'],
            'document_qr_code' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp,gif', 'max:2048'],
            'payout_method' => 'nullable|string|max:100',
            'payout_account' => 'nullable|string|max:255',
            'slot_duration_minutes' => 'required|integer|min:15',
            'max_bookings_per_slot' => 'required|integer|min:1',
            'max_user_bookings_per_slot' => 'required|integer|min:1',
            'schedules' => 'required|array',
            'schedules.*.day_of_week' => 'required|integer|between:0,6',
            'schedules.*.is_open' => 'required|boolean',
            'schedules.*.open_time' => 'nullable|required_if:schedules.*.is_open,true',
            'schedules.*.close_time' => 'nullable|required_if:schedules.*.is_open,true|after:schedules.*.open_time',
            'exceptions' => 'nullable|array',
            'exceptions.*.date' => 'required|date',
            'exceptions.*.is_closed' => 'required|boolean',
            'exceptions.*.open_time' => 'nullable|required_if:exceptions.*.is_closed,false',
            'exceptions.*.close_time' => 'nullable|required_if:exceptions.*.is_closed,false|after:exceptions.*.open_time',
            'exceptions.*.reason' => 'nullable|string',
        ]);

        if ($request->hasFile('logo')) {
            if ($shop->logo_url && Storage::disk('public')->exists($shop->logo_url)) {
                Storage::disk('public')->delete($shop->logo_url);
            }

            $path = $request->file('logo')->store('shop_logos', 'public');
            $shop->logo_url = $path;
            $shop->save();
        }

        if ($request->hasFile('document_qr_code')) {
            if ($shop->document_qr_code && Storage::disk('public')->exists($shop->document_qr_code)) {
                Storage::disk('public')->delete($shop->document_qr_code);
            }

            $shop->document_qr_code = $request->file('document_qr_code')->store('legal_documents', 'public');
            $shop->save();
        }

        DB::transaction(function () use ($shop, $validated) {
            $shop->update([
                'payout_method' => $validated['payout_method'] ?? null,
                'payout_account' => $validated['payout_account'] ?? null,
                'slot_duration_minutes' => $validated['slot_duration_minutes'],
                'max_bookings_per_slot' => $validated['max_bookings_per_slot'],
                'max_user_bookings_per_slot' => $validated['max_user_bookings_per_slot'],
            ]);

            foreach ($validated['schedules'] as $item) {
                ShopSchedule::updateOrCreate(
                    [
                        'shop_id' => $shop->id,
                        'day_of_week' => $item['day_of_week'],
                    ],
                    [
                        'is_open' => (bool) $item['is_open'],
                        'open_time' => $item['is_open'] ? $this->normalizeTime($item['open_time'] ?? null) : null,
                        'close_time' => $item['is_open'] ? $this->normalizeTime($item['close_time'] ?? null) : null,
                    ]
                );
            }

            $incomingExceptions = $validated['exceptions'] ?? [];
            $existingDates = collect($incomingExceptions)
                ->pluck('date')
                ->toArray();

            if (count($existingDates) > 0) {
                ShopException::where('shop_id', $shop->id)
                    ->whereNotIn('date', $existingDates)
                    ->delete();
            } else {
                ShopException::where('shop_id', $shop->id)->delete();
            }

            foreach ($incomingExceptions as $item) {
                ShopException::updateOrCreate(
                    [
                        'shop_id' => $shop->id,
                        'date' => $item['date'],
                    ],
                    [
                        'is_closed' => (bool) $item['is_closed'],
                        'open_time' => $item['is_closed'] ? null : $this->normalizeTime($item['open_time'] ?? null),
                        'close_time' => $item['is_closed'] ? null : $this->normalizeTime($item['close_time'] ?? null),
                        'reason' => $item['reason'] ?? null,
                    ]
                );
            }
        });

        return back()->with('success', 'Shop settings updated successfully.');
    }

    private function normalizeTime(?string $time): ?string
    {
        if (!$time) {
            return null;
        }

        $trimmed = trim($time);

        if (preg_match('/^\d{2}:\d{2}$/', $trimmed)) {
            return $trimmed . ':00';
        }

        if (preg_match('/^\d{2}:\d{2}:\d{2}$/', $trimmed)) {
            return $trimmed;
        }

        return $trimmed;
    }
}
