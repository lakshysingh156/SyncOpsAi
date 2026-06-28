<div align="center">

<img src="https://raw.githubusercontent.com/lakshysingh156/SyncOpsAi/main/docs/screenshots/banner.png" alt="SyncOps AI" width="100%" />

<br/><br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://postgresql.org/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![pnpm](https://img.shields.io/badge/pnpm-workspace-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)

<br/>

> Built to Datadog/Grafana caliber. Production-grade architecture. AI-assisted root cause analysis.

</div>

---

## Overview

Modern engineering teams run dozens of microservices across multiple environments. When something breaks at 2 AM, every second counts. SyncOps AI gives your team a single pane of glass — real-time service health, structured logs, latency metrics, incident timelines, and an AI copilot that speaks your stack.

**The problem:** Observability tooling is either too expensive (Datadog, New Relic), too complex to self-host (Grafana stack), or too shallow (basic dashboards). Teams spend more time context-switching between tools than fixing actual issues.

**SyncOps AI** collapses the observability loop: ingest → visualize → investigate → resolve — with AI assistance at every step.

---

## Features

### 🗂 Service Catalog
Centralized registry for all your microservices. Track language, tier, owner team, and health status. One-click demo seeding with realistic microservice topologies.

### 📋 Log Management
Structured log aggregation with full-text search, severity filters, trace ID correlation, and expandable metadata inspection. Built for high-volume, production-grade log streams.

### 📈 Metrics & Analytics
Time-series visualization for P99 latency, error rate, and throughput per service. Area charts powered by Recharts with configurable service filters and live demo data generation.

### 🚨 Incident Management
Full incident lifecycle — declare, triage, investigate, resolve. Severity-color-coded table, status transitions (`open → investigating → resolved`), and structured timelines.

### 🚀 Deployment Tracking
Immutable deployment audit trail. Track version, environment, deployer, duration, and success rate across every service release.

### 🤖 AI Copilot
Context-aware operational assistant. Ask questions like *"Why is payment-service spiking?"* or *"Summarize all P1 incidents this week"*. Grounded in your live observability data (RAG pipeline — Phase 4).

### 📊 Observability Dashboard
Single-pane summary: live service count, open incidents, deployment velocity, system-wide error rate, P99 latency, and log volume — all in one view.

---

## Architecture

```mermaid
graph TD
    User["👤 Engineer / On-call"]
    UI["Frontend\nReact 19 + Vite + Tailwind v4\nWouter · TanStack Query · Recharts"]
    API["API Layer\nExpress 5 · TypeScript · Node.js 24\nPino structured logging · Zod validation"]
    DB["PostgreSQL 16\nDrizzle ORM\n5 domain tables"]
    AI["AI Copilot\nRAG Pipeline (Phase 4)\nContext-aware responses"]

    User -->|"HTTP / REST"| UI
    UI -->|"Auto-generated\nOrval React Query hooks"| API
    API -->|"Drizzle ORM\ntype-safe queries"| DB
    API --> AI
    AI --> DB

    style User fill:#1e293b,color:#94a3b8
    style UI fill:#1d4ed8,color:#fff
    style API fill:#7c3aed,color:#fff
    style DB fill:#0f766e,color:#fff
    style AI fill:#b45309,color:#fff
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 7, Tailwind CSS v4, Wouter, TanStack Query v5 |
| **UI Components** | Recharts, Lucide React, Framer Motion |
| **Backend** | Express 5, Node.js 24, TypeScript 5.9 |
| **Logging** | Pino + pino-http (structured JSON logs) |
| **Database** | PostgreSQL 16, Drizzle ORM, drizzle-zod |
| **Validation** | Zod v4 (shared across API + frontend) |
| **API Codegen** | Orval (OpenAPI → React Query hooks) |
| **Build** | esbuild (API), Vite (frontend) |
| **Monorepo** | pnpm workspaces, TypeScript project references |
| **Runtime** | Node.js 24, ESM throughout |

---

## Screenshots

> **To make this repo look most impressive, take screenshots in this exact order and state:**

### 1. Overview Dashboard
**Page:** `/` — seed demo data first, then capture all stat tiles + recent incidents (P1 in red) + recent deployments.

![Dashboard Overview](https://placehold.co/1280x720/07090C/3B82F6?text=Dashboard+Screenshot+Coming+Soon)

### 2. Metrics & Analytics
**Page:** `/metrics` — capture all 3 area charts (Latency, Error Rate, Throughput) fully rendered with service filter visible.

![Metrics Analytics](https://placehold.co/1280x720/07090C/3B82F6?text=Metrics+Screenshot+Coming+Soon)

### 3. AI Copilot
**Page:** `/copilot` — show a live conversation: *"Summarize open incidents and identify the highest risk service"* with the AI response visible.

![AI Copilot](https://placehold.co/1280x720/07090C/3B82F6?text=AI+Copilot+Screenshot+Coming+Soon)

---

## Local Development

### Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 24+ | [nodejs.org](https://nodejs.org) |
| pnpm | 9+ | `npm install -g pnpm` |
| PostgreSQL | 16+ | [postgresql.org](https://postgresql.org) or Docker |

### 1. Clone

```bash
git clone https://github.com/lakshysingh156/SyncOpsAi.git
cd SyncOpsAi
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Environment variables

Create `.env` in the project root:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/syncops
```

### 4. Database setup

**Option A — Docker (recommended):**
```bash
docker run -d --name syncops-pg \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 postgres:16

docker exec -it syncops-pg psql -U postgres -c "CREATE DATABASE syncops;"
```

**Option B — Local PostgreSQL:**
```bash
psql -U postgres -c "CREATE DATABASE syncops;"
```

Then push the schema:
```bash
pnpm --filter @workspace/db run push
```

### 5. Run the API server

```bash
# Linux / macOS
DATABASE_URL=postgresql://postgres:password@localhost:5432/syncops \
  pnpm --filter @workspace/api-server run dev

# Windows (PowerShell)
$env:DATABASE_URL="postgresql://postgres:password@localhost:5432/syncops"
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/api-server run start
```

API runs on **http://localhost:8080**

### 6. Run the frontend

```bash
pnpm --filter @workspace/syncops-ai run dev
```

Frontend runs on **http://localhost:5173** (or next available port)

### 7. Seed demo data

Once both servers are running, click **"Generate Demo Data"** on any page (Services, Metrics, Logs, Incidents, Deployments) to populate realistic sample data.

---

## Repository Structure

```
SyncOpsAi/
├── artifacts/
│   ├── api-server/          # Express 5 API (Node.js 24, TypeScript)
│   │   └── src/
│   │       ├── routes/      # Domain route handlers (services, metrics, logs...)
│   │       ├── lib/         # Logger, middleware
│   │       └── index.ts     # Server entrypoint
│   └── syncops-ai/          # React frontend (Vite, Tailwind v4)
│       └── src/
│           ├── pages/       # One file per platform page
│           ├── components/  # Shared UI components (sidebar, topbar...)
│           └── index.css    # Design system tokens + Tailwind theme
├── lib/
│   ├── api-spec/            # OpenAPI YAML (source of truth for all contracts)
│   ├── api-client-react/    # Auto-generated React Query hooks (Orval)
│   ├── api-zod/             # Shared Zod schemas (API ↔ frontend)
│   └── db/                  # Drizzle ORM schema + migrations
│       └── src/schema/      # services, metrics, logs, incidents, deployments
├── pnpm-workspace.yaml
└── README.md
```

---

## Roadmap

### ✅ Phase 1 — Foundation (Complete)
- [x] Service Catalog (full CRUD)
- [x] Structured Log Aggregation
- [x] Metrics Time-Series (latency, error rate, throughput)
- [x] Incident Management (lifecycle + severity)
- [x] Deployment Audit Trail
- [x] AI Copilot UI
- [x] Overview Dashboard

### 🔄 Phase 2 — Tracing & Alerting
- [ ] Distributed Trace Explorer (Jaeger-compatible)
- [ ] Alerting Engine with threshold rules
- [ ] Slack / PagerDuty webhook integration
- [ ] Anomaly detection on metric streams

### 🔜 Phase 3 — Intelligence Layer
- [ ] AI Root Cause Analysis (RAG pipeline on logs + traces)
- [ ] SLO/SLA Management with error budgets
- [ ] Service Dependency Graph
- [ ] Automated runbook suggestions

### 🔮 Phase 4 — Scale
- [ ] Multi-tenancy + RBAC
- [ ] Real-time WebSocket streaming
- [ ] Kubernetes operator for auto-discovery
- [ ] OpenTelemetry collector integration

---

## Why This Project Matters

SyncOps AI demonstrates end-to-end production engineering skills across the full observability stack:

| Domain | Demonstrated Skills |
|---|---|
| **Backend Engineering** | REST API design, Express 5 middleware, structured logging (Pino), Zod validation, esbuild compilation |
| **Platform Engineering** | pnpm monorepo with TypeScript project references, OpenAPI-driven codegen (Orval), shared lib architecture |
| **Database Engineering** | Drizzle ORM schema design, type-safe queries, PostgreSQL migrations, multi-table aggregation |
| **Frontend Engineering** | React 19, TanStack Query for server state, Recharts time-series, Tailwind v4 design system |
| **Observability Systems** | Metrics pipelines, log aggregation, incident lifecycle, deployment tracking — the full ops loop |
| **AI Engineering** | Copilot interface with RAG-ready architecture, context-aware response generation |
| **API Design** | OpenAPI-first contract, versioned routes, auto-generated typed hooks, consistent error responses |

---

## Contributing

SyncOps AI is open source. Contributions are welcome.

```bash
# Fork the repo
git checkout -b feature/your-feature

# Make your changes
pnpm run typecheck  # must pass
pnpm run build      # must pass

# Submit a PR
```

Please open an issue before large changes to align on direction.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built by [Lakshay Singh](https://github.com/lakshysingh156) · Computer Engineering · Targeting SWE / Platform / Cloud / AI roles

⭐ Star this repo if you find it useful

</div>
