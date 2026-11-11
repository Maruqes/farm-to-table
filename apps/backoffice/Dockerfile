FROM php:8.4-cli-alpine
COPY --from=ghcr.io/mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/local/bin/
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
RUN install-php-extensions mongodb
WORKDIR /app
COPY composer.* ./
RUN composer install --no-scripts --no-autoloader --no-interaction
COPY . .
# .dockerignore keeps local sessions/cache/logs out of the image, so recreate the folders Laravel must write to.
RUN mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache
RUN composer dump-autoload --optimize
EXPOSE 8000
# shortcut: artisan serve is single-process, swap for php-fpm/FrankenPHP if load testing this service.
# schedule:work runs the status recorder every minute, next to the web server.
CMD ["sh", "-c", "php artisan schedule:work & exec php artisan serve --host=0.0.0.0 --port=8000"]
