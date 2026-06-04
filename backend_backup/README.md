# SyncOps AI — Backend

FastAPI service for the SyncOps AI observability platform: telemetry ingestion,
log/metric querying, incidents, deployments, alerting, and the AI Copilot (RAG).

## Run locally

```bash
uv venv && uv pip install -e ".[dev]"
export DATABASE_URL=postgresql+asyncpg://syncops:syncops@localhost:5432/syncops
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

See the repo root `README.md` for the full stack and Docker instructions.
