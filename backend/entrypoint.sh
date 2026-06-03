#!/usr/bin/env bash
set -euo pipefail

echo "[entrypoint] Waiting for database..."
python -m app.scripts.wait_for_db || true

echo "[entrypoint] Running migrations..."
alembic upgrade head

echo "[entrypoint] Starting API..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
