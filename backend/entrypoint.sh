#!/bin/bash
set -e

echo "Running database migrations..."
alembic upgrade head

echo "Seeding initial data..."
python seed.py

echo "Starting server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 3000
