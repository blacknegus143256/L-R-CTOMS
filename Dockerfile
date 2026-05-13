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

RUN apt-get update && apt-get install -y \
    git curl unzip libpq-dev libonig-dev libzip-dev zip \
    && docker-php-ext-install pdo pdo_mysql pdo_pgsql mbstring zip

RUN a2enmod rewrite

# Disable prefork, enable event MPM (more efficient for limited resources)
RUN a2dismod mpm_prefork || true
RUN a2enmod mpm_event

ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /var/www/html
COPY . .
COPY --from=frontend /app/public/build ./public/build
RUN composer install --no-dev --optimize-autoloader

RUN mkdir -p /var/www/html/storage/framework/cache/data \
    /var/www/html/storage/framework/views \
    /var/www/html/storage/framework/sessions \
    /var/www/html/storage/logs \
    /var/www/html/bootstrap/cache

# ---------------------------------------------------------
# Optimize Apache Event MPM for low-resource environment
# Event MPM is more efficient than Prefork
# ---------------------------------------------------------
RUN echo "<IfModule mpm_event_module>\n\
    StartServers              2\n\
    MinSpareServers           2\n\
    MaxSpareServers          10\n\
    MaxRequestWorkers        100\n\
    MaxConnectionsPerChild  1000\n\
</IfModule>" > /etc/apache2/mods-available/mpm_event.conf

# Give Apache ownership of the whole app so it stops throwing 500 errors
RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

RUN echo "Listen 80" > /etc/apache2/ports.conf

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]