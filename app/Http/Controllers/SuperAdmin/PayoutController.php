<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Notifications\OrderUpdatedNotification;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PayoutController extends Controller
{
    public function index(): Response
    {
        $orders = Order::query()
            ->whereIn('status', [
                OrderStatus::COMPLETED->value,
                OrderStatus::READY->value,
            ])
            ->where(function ($query) {
                $query->whereNull('payment_type')
                    ->orWhere('payment_type', '!=', 'cash');
            })
            ->where('amount_paid', '>', 0)
            ->with([
                'tailoringShop:id,user_id,shop_name,payout_method,payout_account',
                'user:id,name',
            ])
            ->latest('updated_at')
            ->get([
                'id',
                'tailoring_shop_id',
                'user_id',
                'status',
                'amount_paid',
                'payout_status',
                'updated_at',
            ]);

        $orders->each(function (Order $order) {
            $payoutMethod = $order->tailoringShop?->payout_method;
            $payoutAccount = $order->tailoringShop?->payout_account;

            $order->tailoringShop?->setAttribute(
                'payout_info',
                $payoutMethod && $payoutAccount
                    ? "{$payoutMethod}: {$payoutAccount}"
                    : 'Not set'
            );
        });

        return Inertia::render('SuperAdmin/Payouts/Index', [
            'orders' => $orders,
        ]);
    }

    public function release(Order $order): RedirectResponse
    {
        $eligibleStatuses = [
            OrderStatus::COMPLETED->value,
            OrderStatus::READY->value,
        ];

        $currentStatus = $order->status instanceof OrderStatus
            ? $order->status->value
            : (string) $order->status;

        if (! in_array($currentStatus, $eligibleStatuses, true) || (float) $order->amount_paid <= 0) {
            return redirect()->back()->with('error', 'Order is not eligible for payout release.');
        }

        if ($order->payout_status !== 'Released') {
            $order->update(['payout_status' => 'Released']);
        }

        $order->loadMissing('tailoringShop.user');

        $tailorUser = $order->tailoringShop?->user;

        if ($tailorUser) {
            $tailorUser->notify(new OrderUpdatedNotification(
                $order,
                'Your escrow funds of ₱' . number_format((float) $order->amount_paid, 2) . " for Order #{$order->id} have been released.",
                'payout_released'
            ));
        }

        return redirect()->back()->with('success', 'Escrow payout marked as released.');
    }
}
