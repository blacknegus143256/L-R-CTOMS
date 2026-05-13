<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\URL;

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
        // Force HTTPS in production so Render doesn't trigger mixed-content redirects.
        if (env('APP_ENV') === 'production') {
            URL::forceScheme('https');
        }

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
