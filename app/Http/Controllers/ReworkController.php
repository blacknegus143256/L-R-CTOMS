<?php

namespace App\Http\Controllers;

use App\Models\OrderRework;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReworkController extends Controller
{
    private function authorizeShopAccess(Request $request, OrderRework $rework): void
    {
        $shopId = $request->user()?->tailoringShop?->id;

        if (!$shopId || $rework->order?->tailoring_shop_id !== $shopId) {
            abort(403, 'Unauthorized action.');
        }
    }

    public function storeIndex(Request $request)
    {
        $shop = $request->user()?->tailoringShop;

        $reworks = OrderRework::query()
            ->whereHas('order', function ($query) use ($shop) {
                $query->where('tailoring_shop_id', $shop?->id);
            })
            ->with([
                'order.user.profile',
                'order.customer',
                'order.items.attribute',
                'order.tailoringShop.user.profile',
            ])
            ->latest()
            ->get();

        return Inertia::render('StoreAdmin/Reworks/Index', [
            'reworks' => $reworks,
        ]);
    }

    public function customerIndex(Request $request)
    {
        $reworks = OrderRework::query()
            ->whereHas('order', function ($query) use ($request) {
                $query->where('user_id', $request->user()->id);
            })
            ->with([
                'order.tailoringShop.user.profile',
                'order.customer',
                'order.items.attribute',
            ])
            ->latest()
            ->get();

        return Inertia::render('dashboard/Reworks/Index', [
            'reworks' => $reworks,
        ]);
    }

    public function approve(Request $request, OrderRework $rework)
    {
        $rework->loadMissing('order');
        $this->authorizeShopAccess($request, $rework);

        $rework->update(['status' => 'Approved']);
        $rework->order->update(['status' => 'In Progress']);

        return back()->with('success', 'Rework approved. Order #' . $rework->order_id . ' is now back In Progress.');
    }

    public function complete(Request $request, OrderRework $rework)
    {
        $rework->loadMissing('order');
        $this->authorizeShopAccess($request, $rework);

        $rework->update(['status' => 'Resolved']);
        // Use the enum-backed ready-for-pickup value so the customer sees pickup-ready status.
        $rework->order->update(['status' => 'Ready for Pickup']);

        return back()->with('success', 'Rework resolved! Customer can now pick up the item.');
    }
}