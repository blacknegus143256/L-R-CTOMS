<?php

namespace App\Http\Middleware;

use App\Http\Controllers\SuperAdmin\ImpersonationController;
use App\Models\TailoringShop;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $impersonationStatus = [];
        $pendingShopsCount = $user && $user->role === 'super_admin'
            ? TailoringShop::whereHas('shopStatus', function ($query) {
                $query->where('name', 'Pending');
            })->count()
            : 0;

        // Get impersonation status
        if ($user) {
            $impersonationStatus = ImpersonationController::getImpersonationStatus();
        }

        $authUser = $user ? $user->load('profile') : null;
        $authUserPayload = $authUser
            ? array_merge($authUser->toArray(), [
                'unread_notifications_count' => $authUser->unreadNotifications()->count(),
                'unread_notifications' => $authUser->unreadNotifications()
                    ->latest()
                    ->take(5)
                    ->get(),
            ])
            : null;

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $authUserPayload,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'pending_shops_count' => $pendingShopsCount,
            'impersonation' => $impersonationStatus,
        ];
    }
}
