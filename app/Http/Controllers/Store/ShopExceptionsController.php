<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\ShopException;
use App\Models\TailoringShop;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class ShopExceptionsController extends Controller
{
    public function store(Request $request)
    {
        $shop = $request->user()->tailoringShop;

        if (!$shop) {
            abort(404, 'Shop not found.');
        }

        $validated = $request->validate([
            'date' => 'required|date',
            'is_closed' => 'required|boolean',
            'open_time' => 'nullable|required_if:is_closed,false',
            'close_time' => 'nullable|required_if:is_closed,false|after:open_time',
            'reason' => 'nullable|string|max:255',
        ]);

        ShopException::create([
            'shop_id' => $shop->id,
            'date' => $validated['date'],
            'is_closed' => (bool) $validated['is_closed'],
            'open_time' => $validated['is_closed'] ? null : $this->normalizeTime($validated['open_time'] ?? null),
            'close_time' => $validated['is_closed'] ? null : $this->normalizeTime($validated['close_time'] ?? null),
            'reason' => $validated['reason'] ?? null,
        ]);

        return back()->with('success', 'Exception created successfully.');
    }

    public function update(Request $request, ShopException $exception)
    {
        $shop = $request->user()->tailoringShop;

        if (!$shop || $exception->shop_id !== $shop->id) {
            abort(403, 'Unauthorized to modify this exception.');
        }

        $validated = $request->validate([
            'is_closed' => 'required|boolean',
            'open_time' => 'nullable|required_if:is_closed,false',
            'close_time' => 'nullable|required_if:is_closed,false|after:open_time',
            'reason' => 'nullable|string|max:255',
        ]);

        $exception->update([
            'is_closed' => (bool) $validated['is_closed'],
            'open_time' => $validated['is_closed'] ? null : $this->normalizeTime($validated['open_time'] ?? null),
            'close_time' => $validated['is_closed'] ? null : $this->normalizeTime($validated['close_time'] ?? null),
            'reason' => $validated['reason'] ?? null,
        ]);

        return back()->with('success', 'Exception updated successfully.');
    }

    public function destroy(Request $request, ShopException $exception)
    {
        $shop = $request->user()->tailoringShop;

        if (!$shop || $exception->shop_id !== $shop->id) {
            abort(403, 'Unauthorized to delete this exception.');
        }

        $exception->delete();

        return back()->with('success', 'Exception removed successfully.');
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
