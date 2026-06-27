import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Activity, AlertTriangle, BarChart3, Rocket, ScrollText, TrendingUp, Server, Zap, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface DashboardSummary {
  total_services: number;
  healthy_services: number;
  open_incidents: number;
  critical_incidents: number;
  recent_deployments: number;
  failed_deployments: number;
  avg_error_rate: number;
  avg_latency: number;
  total_logs_24h: number;
  error_logs_24h: number;
}

function useGenerateDemoData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const [m, l, d] = await Promise.all([
        fetch("/api/metrics/generate-demo-data", { method: "POST" }),
        fetch("/api/logs/generate-demo-data", { method: "POST" }),
        fetch("/api/deployments/generate-demo-data", { method: "POST" }),
      ]);
      return { metrics: await m.json(), logs: await l.json(), deployments: await d.json() };
    },
    onSuccess: () => qc.invalidateQueries(),
  });
}

export default function OverviewPage() {
  const { data: summary, isLoading } = useQuery<DashboardSummary>({
    queryKey: ["dashboard-summary"],
    queryFn: () => fetch("/api/dashboard/summary").then(r => r.json()),
    refetchInterval: 30_000,
  });

  const { data: incidents = [] } = useQuery<any[]>({
    queryKey: ["incidents-overview"],
    queryFn: () => fetch("/api/incidents?status=open").then(r => r.json()),
  });

  const { data: deployments = [] } = useQuery<any[]>({
    queryKey: ["deployments-overview"],
    queryFn: () => fetch("/api/deployments").then(r => r.json()),
  });

  const generateDemo = useGenerateDemoData();

  const stats = [
    {
      label: "Services",
      value: isLoading ? "—" : summary?.total_services ?? 0,
      sub: `${summary?.healthy_services ?? 0} healthy`,
      icon: Server,
      color: "text-info",
      href: "/services",
    },
    {
      label: "Open Incidents",
      value: isLoading ? "—" : summary?.open_incidents ?? 0,
      sub: summary?.critical_incidents ? `${summary.critical_incidents} critical` : "none critical",
      icon: AlertTriangle,
      color: (summary?.open_incidents ?? 0) > 0 ? "text-danger" : "text-ok",
      href: "/incidents",
    },
    {
      label: "Deployments (7d)",
      value: isLoading ? "—" : summary?.recent_deployments ?? 0,
      sub: `${summary?.failed_deployments ?? 0} failed`,
      icon: Rocket,
      color: "text-accent",
      href: "/deployments",
    },
    {
      label: "Avg Latency",
      value: isLoading ? "—" : summary?.avg_latency ? `${summary.avg_latency.toFixed(0)}ms` : "N/A",
      sub: "last 24h",
      icon: TrendingUp,
      color: "text-warn",
      href: "/metrics",
    },
    {
      label: "Error Rate",
      value: isLoading ? "—" : summary?.avg_error_rate ? `${summary.avg_error_rate.toFixed(2)}%` : "N/A",
      sub: "across all services",
      icon: BarChart3,
      color: "text-danger",
      href: "/metrics",
    },
    {
      label: "Log Events (24h)",
      value: isLoading ? "—" : summary?.total_logs_24h ?? 0,
      sub: `${summary?.error_logs_24h ?? 0} errors`,
      icon: ScrollText,
      color: "text-muted",
      href: "/logs",
    },
  ];

  const recentDeployments = deployments.slice(0, 5);
  const openIncidents = incidents.slice(0, 5);

  const statusColor: Record<string, string> = {
    success: "text-ok",
    running: "text-info",
    failed: "text-danger",
    rolled_back: "text-warn",
    pending: "text-muted",
  };

  const severityColor: Record<string, string> = {
    critical: "bg-danger/15 text-danger border-danger/30",
    high: "bg-warn/15 text-warn border-warn/30",
    medium: "bg-info/15 text-info border-info/30",
    low: "bg-muted/10 text-muted border-muted/20",
  };

  const isEmpty = !isLoading && (summary?.total_services ?? 0) === 0 && (summary?.total_logs_24h ?? 0) === 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
          <p className="mt-0.5 text-sm text-muted">AI-native observability &amp; operational intelligence.</p>
        </div>
        <div className="flex items-center gap-2">
          {isEmpty && (
            <button
              onClick={() => generateDemo.mutate()}
              disabled={generateDemo.isPending}
              className="flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 transition-colors"
            >
              <Zap className="h-3 w-3" />
              {generateDemo.isPending ? "Generating…" : "Generate Demo Data"}
            </button>
          )}
          <button
            onClick={() => generateDemo.mutate()}
            disabled={generateDemo.isPending}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted hover:bg-surface-2 hover:text-foreground transition-colors"
            title="Refresh demo data"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", generateDemo.isPending && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <div className="stat-tile cursor-pointer group">
              <div className="flex items-start justify-between">
                <p className="text-[11px] font-medium text-muted group-hover:text-foreground/70 transition-colors">{s.label}</p>
                <s.icon className={cn("h-3.5 w-3.5", s.color)} />
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight">{s.value}</p>
              <p className="mt-0.5 text-[11px] text-muted">{s.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Middle row: incidents + deployments */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Open Incidents */}
        <div className="card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="h-4 w-4 text-danger" />
              Open Incidents
            </div>
            <Link href="/incidents" className="text-xs text-muted hover:text-foreground transition-colors">View all →</Link>
          </div>
          {openIncidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
              <div className="text-2xl">✓</div>
              <p className="text-sm font-medium text-ok">All clear</p>
              <p className="text-xs text-muted">No open incidents</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {openIncidents.map((inc: any) => (
                <div key={inc.id} className="flex items-start gap-3 px-4 py-3 hover:bg-surface-2/50 transition-colors">
                  <span className={cn("mt-0.5 inline-flex shrink-0 items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase", severityColor[inc.severity])}>
                    {inc.severity}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{inc.title}</p>
                    <p className="mt-0.5 text-xs text-muted">{inc.service_name ?? "Platform"} · {new Date(inc.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-warn/10 px-2 py-0.5 text-[10px] font-medium text-warn">{inc.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Deployments */}
        <div className="card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Rocket className="h-4 w-4 text-accent" />
              Recent Deployments
            </div>
            <Link href="/deployments" className="text-xs text-muted hover:text-foreground transition-colors">View all →</Link>
          </div>
          {recentDeployments.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
              <p className="text-sm text-muted">No deployments yet</p>
              <Link href="/deployments" className="text-xs text-accent hover:underline">Create first deployment →</Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentDeployments.map((dep: any) => (
                <div key={dep.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2/50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium font-mono">{dep.version}</p>
                      <span className="text-[10px] text-muted bg-surface-2 px-1.5 rounded">{dep.environment}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">{dep.service_name ?? "Unknown"} · {dep.deployed_by ?? "—"}</p>
                  </div>
                  <span className={cn("text-xs font-semibold", statusColor[dep.status] ?? "text-muted")}>{dep.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Platform pillars */}
      <div className="card overflow-hidden">
        <div className="border-b border-border bg-gradient-to-r from-accent/8 to-transparent px-5 py-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold">Platform Capabilities</h2>
          </div>
          <p className="mt-1 text-xs text-muted">SyncOps AI — Phase 1 observability foundation.</p>
        </div>
        <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3">
          {[
            { title: "Service Catalog", desc: "Health, ownership, tier & metadata for every service.", icon: Server, href: "/services" },
            { title: "Structured Logs", desc: "Filter by level, service, and full-text search.", icon: ScrollText, href: "/logs" },
            { title: "Metrics", desc: "Latency, error-rate, and throughput trends with charts.", icon: BarChart3, href: "/metrics" },
            { title: "Incidents", desc: "Lifecycle management with severity and ownership.", icon: AlertTriangle, href: "/incidents" },
            { title: "Deployments", desc: "Audit trail with version, environment and status.", icon: Rocket, href: "/deployments" },
            { title: "AI Copilot", desc: "RAG-powered operational Q&A and RCA (Phase 4).", icon: Zap, href: "/copilot" },
          ].map((p) => (
            <Link key={p.title} href={p.href}>
              <div className="bg-surface p-4 hover:bg-surface-2 transition-colors cursor-pointer group">
                <div className="flex items-center gap-2 mb-1.5">
                  <p.icon className="h-3.5 w-3.5 text-accent group-hover:scale-110 transition-transform" />
                  <div className="text-sm font-medium">{p.title}</div>
                </div>
                <div className="text-xs leading-relaxed text-muted">{p.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
