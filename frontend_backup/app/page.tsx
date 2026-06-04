import { HealthBadge } from "@/components/health-badge";

const PILLARS = [
  {
    title: "Services",
    desc: "Catalog & live health for every service.",
  },
  { title: "Logs", desc: "Search, filter, and triage structured logs." },
  { title: "Metrics", desc: "Latency, error-rate, and throughput trends." },
  {
    title: "Incidents",
    desc: "Lifecycle, severity, and AI root-cause analysis.",
  },
  { title: "Deployments", desc: "History and failure correlation." },
  {
    title: "AI Copilot",
    desc: "RAG-powered operational intelligence.",
  },
] as const;

export default function OverviewPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-muted">
            AI-native observability & operational intelligence.
          </p>
        </div>
        <HealthBadge />
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-border bg-gradient-to-r from-accent/10 to-transparent px-6 py-5">
          <h2 className="text-base font-semibold">Milestone 1 — Foundation</h2>
          <p className="mt-1 text-sm text-muted">
            Scaffold, Docker, and database foundation are in place. Dashboards,
            telemetry, incidents, and the AI Copilot land in subsequent
            milestones.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p) => (
            <div key={p.title} className="bg-surface p-5 hover:bg-surface-2">
              <div className="text-sm font-medium">{p.title}</div>
              <div className="mt-1 text-xs leading-relaxed text-muted">
                {p.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
