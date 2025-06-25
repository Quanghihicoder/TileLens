#!/bin/sh

# Run migrations
npx prisma migrate deploy

echo "Starting backend server..."

# Run the main command (from CMD in Dockerfile or command in compose)
exec "$@"