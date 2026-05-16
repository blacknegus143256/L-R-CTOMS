<?php

namespace App\Policies;

use App\Models\TailoringShop;
use App\Models\User;

class ShopPolicy
{
    public function manageStaff(User $user, TailoringShop $shop): bool
    {
        return $shop->user_id === $user->id;
    }

    public function manageSettings(User $user, TailoringShop $shop): bool
    {
        return $shop->user_id === $user->id;
    }

    public function viewFinancials(User $user, TailoringShop $shop): bool
    {
        return $shop->user_id === $user->id;
    }

    public function viewOrders(User $user, TailoringShop $shop): bool
    {
        if ($shop->user_id === $user->id) {
            return true;
        }

        return $this->isActiveStaffMember($user, $shop);
    }

    private function isActiveStaffMember(User $user, TailoringShop $shop): bool
    {
        if (! in_array($user->role, ['store_staff', 'staff'], true)) {
            return false;
        }

        return $user->workplaces()
            ->where('tailoring_shops.id', $shop->id)
            ->wherePivot('is_active', true)
            ->exists();
    }
}
