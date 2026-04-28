<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::useBuildDirectory('build');
        Vite::prefetch(concurrency: 3);

        // GOD MODE: Super Admin bypasses all authorization checks
        Gate::before(function ($user, $ability) {
            // If user has super_admin role, grant all permissions
            if ($user && $user->role === 'super_admin') {
                return true;
            }
        });
    }
}
