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
            ? TailoringShop::where('status', 'pending')->count()
            : 0;

        // Get impersonation status
        if ($user) {
            $impersonationStatus = ImpersonationController::getImpersonationStatus();
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? $user->load('profile') : null,
            ],
            'unread_notifications' => $user
                ? $user->unreadNotifications()->take(5)->get()
                : [],
            'pending_shops_count' => $pendingShopsCount,
            'impersonation' => $impersonationStatus,
        ];
    }
}
