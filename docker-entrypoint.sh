#!/bin/bash
set -e

echo "🚀 Starting Stitch Central..."

# 1. Ensure storage and bootstrap directories have correct permissions
echo "🔐 Fixing directory permissions..."
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# 2. Clear old caches
echo "🗑️  Clearing caches..."
php artisan cache:clear
php artisan config:clear

# 3. Re-cache configuration (STRICT MODE: No "|| true")
echo "📝 Caching configuration..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 4. Run database migrations safely
echo "📦 Running database migrations..."
php artisan migrate --force

# 5. Start Apache in the foreground
echo "✅ Stitch Central is running!"
exec apache2-foreground
