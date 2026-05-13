#!/bin/bash
set -e

echo "🚀 Starting FitCraft (CTOMS)..."

echo "🗑️  Clearing caches..."
php artisan cache:clear || true
php artisan config:clear || true

echo "📝 Caching configuration..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "📦 Running database migrations..."
php artisan migrate --force

# ---------------------------------------------------------
# THE MAGIC FIX: Grant permissions AFTER Root creates the files
# ---------------------------------------------------------
echo "🔐 Handing over permissions to Apache..."
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

echo "✅ CTOMS is live!"
exec apache2-foreground
