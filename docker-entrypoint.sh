#!/bin/bash
set -e

echo "🚀 Starting FitCraft (CTOMS)..."

show_laravel_log() {
	if [ -f /var/www/html/storage/logs/laravel.log ]; then
		echo "📄 Last 200 lines of Laravel log:"
		tail -n 200 /var/www/html/storage/logs/laravel.log
	else
		echo "⚠️ Laravel log file not found at storage/logs/laravel.log"
	fi
}

run_artisan_step() {
	local step="$1"
	shift

	echo "🔧 ${step}..."
	if ! php artisan "$@"; then
		echo "❌ Failed: ${step}"
		show_laravel_log
		exit 1
	fi
}

if [ -z "${APP_KEY:-}" ]; then
	echo "❌ APP_KEY is missing. Set APP_KEY in Render Environment."
	exit 1
fi

echo "ℹ️ Runtime environment summary:"
echo "   APP_ENV=${APP_ENV:-unset}"
echo "   APP_DEBUG=${APP_DEBUG:-unset}"
echo "   DB_CONNECTION=${DB_CONNECTION:-unset}"
echo "   DB_HOST=${DB_HOST:-unset}"
echo "   DB_PORT=${DB_PORT:-unset}"
echo "   DB_DATABASE=${DB_DATABASE:-unset}"
echo "   DB_USERNAME=${DB_USERNAME:-unset}"

echo "🗑️  Clearing caches..."
php artisan cache:clear || true
php artisan config:clear || true

echo "📝 Caching configuration..."
run_artisan_step "Cache config" config:cache
run_artisan_step "Cache routes" route:cache
run_artisan_step "Cache views" view:cache

echo "📦 Running database migrations..."
run_artisan_step "Run migrations" migrate --force
# ADD THIS NEW SECTION:
echo "🌱 Seeding the database..."
php artisan db:seed --force
# ---------------------------------------------------------
# THE MAGIC FIX: Grant permissions AFTER Root creates the files
# ---------------------------------------------------------
echo "🔐 Handing over permissions to Apache..."
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

echo "✅ CTOMS is live!"
exec apache2-foreground
