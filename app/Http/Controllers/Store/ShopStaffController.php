<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\TailoringShop;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ShopStaffController extends Controller
{
    private function shopForOwner(Request $request): TailoringShop
    {
        $shop = TailoringShop::where('user_id', Auth::id())->firstOrFail();
        $this->authorize('manageStaff', $shop);

        return $shop;
    }

    public function index(Request $request)
    {
        $shop = $this->shopForOwner($request);
        $staff = $shop->staff()
            ->select('users.id', 'users.name', 'users.email', 'users.role')
            ->withPivot('is_active', 'created_at')
            ->orderByDesc('shop_staff.is_active')
            ->orderBy('users.name')
            ->get();

        return Inertia::render('Shop/StaffManagement', [
            'shop' => $shop,
            'staff' => $staff,
        ]);
    }

    public function invite(Request $request)
    {
        $shop = $this->shopForOwner($request);

        $validated = $request->validate([
            'email' => ['required', 'email', Rule::exists('users', 'email')],
        ]);

        $user = User::where('email', $validated['email'])->firstOrFail();

        $shop->staff()->syncWithoutDetaching([
            $user->id => ['is_active' => true],
        ]);
        $shop->staff()->updateExistingPivot($user->id, ['is_active' => true]);

        if (! in_array($user->role, ['super_admin', 'store_admin'], true)) {
            $user->forceFill(['role' => User::ROLE_STORE_STAFF])->save();
        }

        return back()->with('success', 'Staff member invited successfully.');
    }

    public function toggleActive(Request $request, User $user)
    {
        $shop = $this->shopForOwner($request);

        $validated = $request->validate([
            'is_active' => ['nullable', 'boolean'],
        ]);

        $existingPivot = $shop->staff()->where('users.id', $user->id)->first();
        if (! $existingPivot) {
            return back()->withErrors(['user' => 'User is not a member of this shop.']);
        }

        $current = (bool) ($existingPivot->pivot->is_active ?? false);
        $next = array_key_exists('is_active', $validated)
            ? (bool) $validated['is_active']
            : ! $current;

        $shop->staff()->updateExistingPivot($user->id, [
            'is_active' => $next,
        ]);

        return back()->with('success', $next ? 'Staff member activated.' : 'Staff member deactivated.');
    }

    public function store(Request $request)
    {
        return $this->invite($request);
    }

    public function destroy(Request $request, User $user)
    {
        $shop = $this->shopForOwner($request);

        $shop->staff()->detach($user->id);

        return back()->with('success', 'Staff member removed from the shop.');
    }
}
