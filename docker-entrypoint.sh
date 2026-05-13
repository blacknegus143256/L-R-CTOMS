#!/bin/bash
set -e

echo "🚀 Starting Stitch Central..."

# ---------------------------------------------------------
# THE SECRET FILE FIX: Move the Render .env file into Laravel
# ---------------------------------------------------------
if [ -f /etc/secrets/.env ]; then
	echo "📄 Found Render Secret .env file! Copying to Laravel..."
	cp /etc/secrets/.env /var/www/html/.env
	chown www-data:www-data /var/www/html/.env
fi

echo "🔐 Fixing directory permissions..."
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

echo "🗑️  Clearing caches..."
php artisan cache:clear
php artisan config:clear

echo "📝 Caching configuration..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "📦 Running database migrations..."
php artisan migrate --force

echo "✅ Stitch Central is running!"
exec apache2-foreground
