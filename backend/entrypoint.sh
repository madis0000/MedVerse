#!/bin/sh
set -e

echo "Pushing database schema..."
npx prisma db push --accept-data-loss

echo "Running database seed..."
npx prisma db seed || echo "Seed already applied or skipped"

echo "Starting application..."
node dist/src/main.js
