# ==========================================
# Stage 1 - Build Frontend (React/Inertia)
# ==========================================
FROM node:22 AS frontend

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build 

# ==========================================
# Stage 2 - Laravel Backend + Apache Server
# ==========================================
FROM php:8.2-apache

# Install system dependencies and PHP extensions required by Laravel
RUN apt-get update && apt-get install -y \
    git \
    curl \
    unzip \
    libpq-dev \
    libonig-dev \
    libzip-dev \
    zip \
    && docker-php-ext-install pdo pdo_mysql pdo_pgsql mbstring zip

# Enable Apache mod_rewrite (Required for Laravel routing)
RUN a2enmod rewrite

# Change Apache's default directory to Laravel's /public folder
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy Laravel files
COPY . .

# Copy built frontend assets from Stage 1
COPY --from=frontend /app/public/build ./public/build

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader

# Create required Laravel directories
RUN mkdir -p /var/www/html/storage/framework/cache/data \
    /var/www/html/storage/framework/views \
    /var/www/html/storage/framework/sessions \
    /var/www/html/storage/logs \
    /var/www/html/bootstrap/cache

# Create storage symlink (public/storage → storage/app/public)
RUN php artisan storage:link --force 2>/dev/null || true

# Fix permissions early (before artisan commands)
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache && \
    chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# ---------------------------------------------------------
# THE HAMMER: Force Apache to strictly listen on Port 80
# This completely overwrites the corrupted ports.conf file
# ---------------------------------------------------------
RUN echo "Listen 80" > /etc/apache2/ports.conf

# DO NOT generate APP_KEY here - it must come from Render environment variables
# Ephemeral containers will get a new key and log out all users


# Entrypoint script to run migrations and start Apache
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]