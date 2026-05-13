#!/bin/bash

set -e

echo "🚀 Starting Stitch Central..."

# Ensure storage and bootstrap directories have correct permissions
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Generate APP_KEY if not already set in environment
if [ -z "$APP_KEY" ]; then
    echo "⚙️  Generating APP_KEY..."
    php artisan key:generate --force
fi

# Run migrations (with error handling for initial deployment)
echo "📦 Running database migrations..."
php artisan migrate --force --no-interaction || {
    echo "⚠️  Migration failed. Attempting to continue..."
    # Don't fail on migration errors to allow Render to keep the service alive
    # The database may still be initializing
}

# Clear any cached configs that might have been built with different settings
echo "🗑️  Clearing caches..."
php artisan cache:clear || true
php artisan config:clear || true

# Re-cache configuration after migrations
echo "📝 Caching configuration..."
php artisan config:cache || true
php artisan route:cache || true

# Start Apache in the foreground
echo "✅ Stitch Central is running!"
apache2-foreground
