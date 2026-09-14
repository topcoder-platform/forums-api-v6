#!/bin/sh
set -eu

printf '%s\n' 'Applying forums database migrations.'
./node_modules/.bin/prisma migrate deploy

printf '%s\n' 'Starting Forums API v6.'
exec node dist/main.js
