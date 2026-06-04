# SyncOps AI backend — FastAPI on Python 3.12 (uv-managed)
FROM python:3.12-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install uv (fast Python package manager)
COPY --from=ghcr.io/astral-sh/uv:0.7.9 /uv /usr/local/bin/uv

# Install dependencies first (better layer caching)
COPY pyproject.toml ./
RUN uv pip install --system --no-cache .

# App source
COPY . .

EXPOSE 8000

# entrypoint runs migrations then starts the server
RUN chmod +x ./entrypoint.sh
CMD ["./entrypoint.sh"]
