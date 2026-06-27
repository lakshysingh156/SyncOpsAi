# SyncOps AI

AI-powered observability & operational intelligence platform — a portfolio-grade Datadog/Grafana-inspired dashboard for services, metrics, logs, incidents, deployments, and AI-assisted RCA.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/syncops-ai run dev` — run the frontend (auto-assigned port)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `cd lib/api-spec && ./node_modules/.bin/orval --config ./orval.config.ts` — regenerate API hooks (use direct path, not pnpm script)
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind v4 + Wouter + TanStack Query + Recharts
- API: Express 5 + Pino logging
- DB: PostgreSQL + Drizzle ORM (5 tables: services, metrics, logs, incidents, deployments)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from `lib/api-spec/openapi.yaml`)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle schema (services, metrics, logs, incidents, deployments)
- `lib/api-client-react/src/generated/` — auto-generated React Query hooks (do not edit)
- `artifacts/api-server/src/routes/` — Express route handlers per domain
- `artifacts/syncops-ai/src/pages/` — one file per platform page
- `artifacts/syncops-ai/src/index.css` — Tailwind v4 @theme tokens + custom classes

## Architecture decisions

- **Tailwind v4 `@import` order**: Google Fonts `@import url(...)` must precede `@import "tailwindcss"` to avoid PostCSS error
- **Codegen via direct path**: `cd lib/api-spec && ./node_modules/.bin/orval --config ./orval.config.ts` — the `pnpm --filter` script fails with ERR_MODULE_NOT_FOUND for `@orval/core`
- **Custom CSS classes** (`.card`, `.stat-tile`): defined as plain CSS in `index.css`, not via `@apply`, to avoid Tailwind v4 utility resolution errors
- **Dashboard summary**: uses a single aggregate SQL endpoint (`/api/dashboard/summary`) that fans out to multiple tables with `Promise.all` for low-latency reads
- **Demo data flow**: frontend "Generate" buttons call dedicated `POST /generate-demo-data` routes; data seeding is idempotent and can be repeated

## Product

SyncOps AI — Phase 1 (Foundation) complete:
- **Overview Dashboard**: live stat tiles (services, incidents, deployments, latency, error rate, log volume), recent incidents panel, recent deployments panel
- **Service Catalog**: full CRUD, language/tier/owner metadata, one-click demo seed (8 realistic microservices)
- **Structured Logs**: 150-entry log stream with level filter pills, full-text search, row expansion showing trace ID + metadata JSON
- **Metrics**: area charts for latency, error rate, throughput with service filter and generated demo data
- **Incidents**: severity-color table, status lifecycle (open → investigating → resolved), declare modal, demo seed
- **Deployments**: audit trail with version, environment badge, deployer, duration, success rate strip
- **AI Copilot**: GPT-4o chat UI with suggested prompts, typing animation, context-aware mock responses (Phase 4 RAG pipeline placeholder)

## User preferences

- Lakshay Singh — Computer Engineering student targeting SWE/Platform/Cloud/AI roles
- Every decision should maximize resume impact, systems design depth, and production realism
- Follow the 10-phase product directive: Phase 0 (stabilization) → Phase 1 (observability) → Phase 2 (tracing) → ... → Phase 10 (elite)

## Gotchas

- Run codegen AFTER updating `openapi.yaml`, BEFORE editing generated files (they get overwritten)
- `pnpm --filter @workspace/db run push` must be run after any schema change in `lib/db/src/schema/`
- The `@workspace/api-client-react` package must be built/linked before Vite can resolve it — the workspace symlinks handle this automatically in dev mode
- `useUpdateService` mutation takes `{ id: string, data: ServiceUpdate }` — matches the generated orval wrapper

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- Product directive: `attached_assets/Pasted-SYNCOPS-AI-MASTER-PRODUCT-DEVELOPMENT-DIRECTIVE-*.txt`
