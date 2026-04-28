<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderRework;
use App\Notifications\OrderUpdatedNotification;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OrderReworkController extends Controller
{
    private const ALLOWED_STATUSES = [
        'Pending Review',
        'Accepted',
        'Rejected',
        'In Progress',
        'Resolved',
    ];

    private function normalizeOrderStatus(Order $order): string
    {
        return $order->status instanceof \App\Enums\OrderStatus ? $order->status->value : (string) $order->status;
    }

    private function storeProofImages(Request $request): ?array
    {
        $proofImages = [];

        if ($request->hasFile('proof_images')) {
            foreach ((array) $request->file('proof_images') as $image) {
                $proofImages[] = $image->store('order_reworks/proof_images', 'public');
            }
        }

        return !empty($proofImages) ? $proofImages : null;
    }

    public function store(Request $request, Order $order)
    {
        if ($request->user()->id !== $order->user_id) {
            abort(403, 'Unauthorized. This order does not belong to you.');
        }

        if ($this->normalizeOrderStatus($order) !== 'Completed') {
            abort(403, 'Reworks can only be requested on completed orders.');
        }

        if ($order->reworkRequest) {
            return back()->withErrors(['rework' => 'A rework request already exists for this order.']);
        }

        $validated = $request->validate([
            'reason_category' => ['required', 'string', 'max:120'],
            'customer_notes' => ['required', 'string', 'max:2000'],
            'proof_images' => ['nullable', 'array'],
            'proof_images.*' => ['image', 'mimes:jpeg,png,jpg,webp,gif', 'max:2048'],
        ]);

        $rework = OrderRework::create([
            'order_id' => $order->id,
            'reason_category' => $validated['reason_category'],
            'customer_notes' => $validated['customer_notes'],
            'status' => 'Pending Review',
            'proof_images' => $this->storeProofImages($request),
        ]);

        if ($order->tailoringShop?->user) {
            $order->tailoringShop->user->notify(new OrderUpdatedNotification(
                $order,
                "A rework was requested for order #{$order->id}.",
                'rework_requested'
            ));
        }

        return back()->with('message', 'Rework request submitted successfully.');
    }

    public function accept(Request $request, OrderRework $orderRework)
    {
        $order = $orderRework->order()->with('tailoringShop', 'user')->firstOrFail();
        $shop = $order->tailoringShop;

        if (!$shop || $shop->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized action.');
        }

        if ($this->normalizeOrderStatus($order) !== 'Completed') {
            abort(422, 'Rework can only be processed for completed orders.');
        }

        $validated = $request->validate([
            'tailor_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $orderRework->update([
            'status' => 'Accepted',
            'tailor_notes' => $validated['tailor_notes'] ?? $orderRework->tailor_notes,
        ]);

        if ($order->user) {
            $order->user->notify(new OrderUpdatedNotification(
                $order,
                "Your rework request for order #{$order->id} was accepted. Bring your item back to the shop for reworking.",
                'rework_updated'
            ));
        }

        return back()->with('message', 'Rework request accepted.');
    }

    public function reject(Request $request, OrderRework $orderRework)
    {
        $order = $orderRework->order()->with('tailoringShop', 'user')->firstOrFail();
        $shop = $order->tailoringShop;

        if (!$shop || $shop->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'tailor_notes' => ['required', 'string', 'max:2000'],
        ]);

        $orderRework->update([
            'status' => 'Rejected',
            'tailor_notes' => $validated['tailor_notes'],
        ]);

        if ($order->user) {
            $order->user->notify(new OrderUpdatedNotification(
                $order,
                "Your rework request for order #{$order->id} was rejected.",
                'rework_updated',
                $validated['tailor_notes'],
                $shop?->shop_name
            ));
        }

        return back()->with('message', 'Rework request rejected.');
    }

    public function markGarmentReceived(Request $request, OrderRework $orderRework)
    {
        $order = $orderRework->order()->with('tailoringShop', 'user')->firstOrFail();
        $shop = $order->tailoringShop;

        if (!$shop || $shop->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized action.');
        }

        if (!in_array($orderRework->status, ['Accepted', 'Pending Review'], true)) {
            abort(422, 'Garment can only be marked received after acceptance.');
        }

        $validated = $request->validate([
            'tailor_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $orderRework->update([
            'status' => 'In Progress',
            'tailor_notes' => $validated['tailor_notes'] ?? $orderRework->tailor_notes,
        ]);

        if ($order->user) {
            $order->user->notify(new OrderUpdatedNotification(
                $order,
                "Your garment for rework on order #{$order->id} has been received and is now in progress.",
                'rework_updated'
            ));
        }

        return back()->with('message', 'Garment marked as received for rework.');
    }

    public function updateStatus(Request $request, OrderRework $orderRework)
    {
        $order = $orderRework->order()->with('tailoringShop', 'user')->firstOrFail();
        $shop = $order->tailoringShop;

        if (!$shop || $shop->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(self::ALLOWED_STATUSES)],
            'tailor_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $orderRework->update([
            'status' => $validated['status'],
            'tailor_notes' => $validated['tailor_notes'] ?? $orderRework->tailor_notes,
        ]);

        if ($order->user) {
            $order->user->notify(new OrderUpdatedNotification(
                $order,
                "Rework status for order #{$order->id} is now {$orderRework->status}.",
                'rework_updated'
            ));
        }

        return back()->with('message', 'Rework status updated successfully.');
    }
}
