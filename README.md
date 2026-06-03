# SyncOps AI

**AI-native observability & operational-intelligence platform.** Ship logs, metrics, and deployment events; get service health, log search, metric trends, incident management, and an **AI Copilot** that performs RAG-based **root-cause analysis** over your telemetry.

> Portfolio-grade MVP. Built to be modular so a production telemetry plane (e.g. ClickHouse) can slot in later without changing the API or UI.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router, strict TS), Tailwind, dark-first SaaS UI |
| Backend | FastAPI (Python 3.12), async SQLAlchemy 2.0, Pydantic v2 |
| Database | PostgreSQL + **pgvector** (Supabase in prod) |
| AI | Gemini API (analysis + embeddings) |
| Infra | Docker / docker-compose · Vercel (web) · Render (api) · Supabase (db) |

## Architecture (MVP)

```
Next.js (Vercel) ──REST/SSE──▶ FastAPI (Render) ──asyncpg──▶ Postgres + pgvector (Supabase)
                                     │
                                     ├─ ingest (logs / metrics / deployments, API-key auth)
                                     ├─ query (logs search, metric aggregation, health)
                                     ├─ alerting (APScheduler → incidents)
                                     └─ copilot (RAG + Gemini → cited root-cause analysis)
```

The backend is organized into modules behind a `TelemetryRepository` seam, so the
telemetry store can later be swapped for ClickHouse without touching routers or UI.

## Project layout

```
syncops-ai/
├─ backend/    FastAPI service (app/, alembic/, Dockerfile)
├─ frontend/   Next.js app (app/, components/, lib/, Dockerfile)
├─ docker-compose.yml
├─ .env.example
└─ Makefile
```

## Quick start (Docker)

```bash
cp .env.example .env          # adjust values as needed
make up                       # build + start db, backend, frontend
```

- Frontend: http://localhost:3000
- Backend docs: http://localhost:8000/docs
- Health: http://localhost:8000/health  ·  DB health: http://localhost:8000/health/db

Migrations run automatically on backend start. To run them manually:

```bash
make migrate
```

## Local development (without Docker)

```bash
# Backend
cd backend
uv sync --extra dev
uv run alembic upgrade head
uv run uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## Milestones

1. **Foundation** — scaffold, Docker, database models & migrations ✅
2. Backend APIs + telemetry ingestion
3. Frontend dashboard + logs + metrics
4. Incidents + deployments
5. AI Copilot + RAG
6. Deployment + README + polish

## Environment variables

See [`.env.example`](./.env.example). Key ones: `DATABASE_URL`, `INGEST_API_KEY`,
`GEMINI_API_KEY`, `CORS_ORIGINS`, `BACKEND_URL`.
