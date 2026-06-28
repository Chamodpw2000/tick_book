#!/bin/sh
set -e

if [ -f /app/.runtime-env ]; then
	. /app/.runtime-env
fi

echo "Running Prisma db push..."
npx prisma db push --accept-data-loss
echo "Starting service..."
exec node index.js