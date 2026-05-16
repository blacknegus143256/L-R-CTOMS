<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\User;
use App\Notifications\OrderAssignedNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class OrderAssignmentController extends Controller
{
    public function show(Request $request, Order $order)
    {
        $shop = $order->tailoringShop;

        if (! $shop) {
            abort(404, 'Shop not found for this order.');
        }

        $this->authorize('manageStaff', $shop);

        $order->load([
            'customer:id,name,email,phone_number',
            'user:id,name,email',
            'assignments:id,name,email',
            'measurements:id,order_id,measurement_name,measurement_value,unit',
            'items.shopAttribute:id,item_name,unit',
        ]);

        $staffMembers = $shop->activeStaff()
            ->select('users.id', 'users.name', 'users.email')
            ->orderBy('users.name')
            ->get();

        return Inertia::render('Shop/OrderDetails', [
            'order' => $order,
            'staffMembers' => $staffMembers,
        ]);
    }

    public function attach(Request $request, Order $order)
    {
        $shop = $order->tailoringShop;

        if (! $shop) {
            abort(404, 'Shop not found for this order.');
        }

        $this->authorize('manageStaff', $shop);

        $validated = $request->validate([
            'assignee_ids' => ['required', 'array'],
            'assignee_ids.*' => [
                'integer',
                Rule::exists('shop_staff', 'user_id')->where(function ($query) use ($shop) {
                    $query->where('shop_id', $shop->id)->where('is_active', true);
                }),
            ],
        ]);

        $assigneeIds = collect($validated['assignee_ids'])->unique()->values()->all();
        $syncChanges = $order->assignments()->sync($assigneeIds);

        $newlyAssignedIds = $syncChanges['attached'] ?? [];

        if (! empty($newlyAssignedIds)) {
            $newlyAssignedUsers = User::whereIn('id', $newlyAssignedIds)->get();

            Notification::send($newlyAssignedUsers, new OrderAssignedNotification($order, $request->user()));
        }

        return back()->with('success', 'Order assignees updated successfully.');
    }

    public function detach(Request $request, Order $order, int $userId)
    {
        $shop = $order->tailoringShop;

        if (! $shop) {
            abort(404, 'Shop not found for this order.');
        }

        $this->authorize('manageStaff', $shop);

        $order->assignments()->detach($userId);

        return back()->with('success', 'Assignee removed from order.');
    }
}
