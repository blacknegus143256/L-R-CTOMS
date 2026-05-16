<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    public function view(User $user, Order $order): bool
    {
        if ($order->tailoringShop?->user_id === $user->id) {
            return true;
        }

        return $this->isActiveStaffForShop($user, $order->tailoringShop)
            && $order->assignments()->where('users.id', $user->id)->exists();
    }

    public function update(User $user, Order $order): bool
    {
        if ($order->tailoringShop?->user_id === $user->id) {
            return true;
        }

        return $this->isActiveStaffForShop($user, $order->tailoringShop)
            && $order->assignments()->where('users.id', $user->id)->exists();
    }

    private function isActiveStaffForShop(User $user, ?\App\Models\TailoringShop $shop): bool
    {
        if (! $shop) {
            return false;
        }

        if (! in_array($user->role, ['store_staff', 'staff'], true)) {
            return false;
        }

        return $user->workplaces()
            ->where('tailoring_shops.id', $shop->id)
            ->wherePivot('is_active', true)
            ->exists();
    }
}
