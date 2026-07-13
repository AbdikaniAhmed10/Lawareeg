#!/bin/sh
set -e

cd /var/www/html

if [ -z "$APP_KEY" ] || [ "$APP_KEY" = "base64:GENERATE_ME" ]; then
  echo "WARNING: APP_KEY is missing. Generating one for this container…"
  php artisan key:generate --force --show > /tmp/appkey || true
fi

php artisan config:clear || true
php artisan migrate --force
php artisan storage:link || true
php artisan config:cache || true
php artisan route:cache || true

exec docker-php-entrypoint "$@"
