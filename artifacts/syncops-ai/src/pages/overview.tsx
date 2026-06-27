import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Server, AlertTriangle, Rocket, TrendingUp, BarChart3,
  ScrollText, RefreshCw, Zap, ArrowUpRight, CheckCircle,
} from "lucide-react";
import { Link } from "wouter";

interface DashboardSummary {
  total_services: number; healthy_services: number;
  open_incidents: number; critical_incidents: number;
  recent_deployments: number; failed_deployments: number;
  avg_error_rate: number; avg_latency: number;
  total_logs_24h: number; error_logs_24h: number;
}

const S = {
  pageHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 } as React.CSSProperties,
  h1: { fontSize: 18, fontWeight: 600, color: "#E8ECF4", letterSpacing: "-0.02em" } as React.CSSProperties,
  sub: { fontSize: 12, color: "#4E5A6B", marginTop: 2 } as React.CSSProperties,
  grid6: { display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 16 } as React.CSSProperties,
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 } as React.CSSProperties,
};

function StatCard({ label, value, sub, icon: Icon, accent, href }: {
  label: string; value: string | number; sub: string;
  icon: React.ElementType; accent: string; href: string;
}) {
  return (
    <Link href={href}>
      <div className="stat-card" style={{ cursor: "pointer" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <span style={{ fontSize: 11, color: "#4E5A6B", fontWeight: 500, letterSpacing: "0.02em" }}>{label}</span>
          <Icon size={14} style={{ color: accent, flexShrink: 0 }} />
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#E8ECF4", letterSpacing: "-0.03em", lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 11, color: "#4E5A6B", marginTop: 6 }}>{sub}</div>
      </div>
    </Link>
  );
}

export default function OverviewPage() {
  const qc = useQueryClient();
  const { data: summary, isLoading } = useQuery<DashboardSummary>({
    queryKey: ["dashboard-summary"],
    queryFn: () => fetch("/api/dashboard/summary").then(r => r.json()),
    refetchInterval: 30_000,
  });
  const { data: incidents = [] } = useQuery<any[]>({
    queryKey: ["incidents-recent"],
    queryFn: () => fetch("/api/incidents?status=open").then(r => r.json()),
  });
  const { data: deployments = [] } = useQuery<any[]>({
    queryKey: ["deployments-recent"],
    queryFn: () => fetch("/api/deployments").then(r => r.json()),
  });

  const genDemo = useMutation({
    mutationFn: () => Promise.all([
      fetch("/api/metrics/generate-demo-data", { method: "POST" }),
      fetch("/api/logs/generate-demo-data", { method: "POST" }),
      fetch("/api/deployments/generate-demo-data", { method: "POST" }),
    ]),
    onSuccess: () => qc.invalidateQueries(),
  });

  const D = summary;
  const loading = isLoading;

  const stats = [
    { label: "SERVICES", value: loading ? "—" : D?.total_services ?? 0, sub: `${D?.healthy_services ?? 0} healthy`, icon: Server, accent: "#60A5FA", href: "/services" },
    { label: "OPEN INCIDENTS", value: loading ? "—" : D?.open_incidents ?? 0, sub: D?.critical_incidents ? `${D.critical_incidents} critical` : "none critical", icon: AlertTriangle, accent: D?.open_incidents ? "#EF4444" : "#10B981", href: "/incidents" },
    { label: "DEPLOYMENTS (7d)", value: loading ? "—" : D?.recent_deployments ?? 0, sub: `${D?.failed_deployments ?? 0} failed`, icon: Rocket, accent: "#8B5CF6", href: "/deployments" },
    { label: "AVG LATENCY", value: loading ? "—" : D?.avg_latency ? `${D.avg_latency.toFixed(0)}ms` : "—", sub: "last 24h", icon: TrendingUp, accent: "#F59E0B", href: "/metrics" },
    { label: "ERROR RATE", value: loading ? "—" : D?.avg_error_rate ? `${D.avg_error_rate.toFixed(2)}%` : "—", sub: "all services", icon: BarChart3, accent: "#EF4444", href: "/metrics" },
    { label: "LOG EVENTS (24h)", value: loading ? "—" : D?.total_logs_24h ?? 0, sub: `${D?.error_logs_24h ?? 0} errors`, icon: ScrollText, accent: "#4E5A6B", href: "/logs" },
  ];

  const DEP_STATUS: Record<string, { color: string; dot: string }> = {
    success: { color: "#10B981", dot: "#10B981" },
    failed: { color: "#EF4444", dot: "#EF4444" },
    running: { color: "#60A5FA", dot: "#3B82F6" },
    rolled_back: { color: "#F59E0B", dot: "#F59E0B" },
    pending: { color: "#4E5A6B", dot: "#252D3A" },
  };

  const INC_SEV: Record<string, string> = { critical: "#EF4444", high: "#F97316", medium: "#F59E0B", low: "#8B5CF6" };

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      {/* Header */}
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.h1}>Overview</h1>
          <p style={S.sub}>AI-native observability & operational intelligence platform</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-sm btn-outline-blue"
            onClick={() => genDemo.mutate()}
            disabled={genDemo.isPending}
          >
            <Zap size={12} />
            {genDemo.isPending ? "Generating…" : "Generate Demo Data"}
          </button>
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => qc.invalidateQueries()}
          >
            <RefreshCw size={12} style={{ animation: isLoading ? "spin 1s linear infinite" : "none" }} />
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div style={S.grid6}>
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Incidents + Deployments */}
      <div style={S.grid2}>
        {/* Open Incidents */}
        <div className="panel">
          <div className="panel-header">
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <AlertTriangle size={14} style={{ color: "#EF4444" }} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: "#E8ECF4" }}>Open Incidents</span>
              {incidents.length > 0 && (
                <span style={{ background: "rgba(239,68,68,0.15)", color: "#F87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 99, padding: "0 6px", fontSize: 10.5, fontWeight: 600 }}>
                  {incidents.length}
                </span>
              )}
            </div>
            <Link href="/incidents">
              <span style={{ fontSize: 11, color: "#3B82F6", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                View all <ArrowUpRight size={11} />
              </span>
            </Link>
          </div>
          {incidents.length === 0 ? (
            <div style={{ padding: "32px 20px", textAlign: "center" }}>
              <CheckCircle size={22} style={{ color: "#10B981", margin: "0 auto 8px" }} />
              <div style={{ fontSize: 12.5, color: "#10B981", fontWeight: 500 }}>All clear</div>
              <div style={{ fontSize: 11, color: "#4E5A6B", marginTop: 3 }}>No open incidents</div>
            </div>
          ) : (
            <div>
              {incidents.slice(0, 6).map((inc: any) => (
                <div key={inc.id} style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "10px 16px", borderBottom: "1px solid #111318",
                  transition: "background 0.1s", cursor: "pointer",
                }}>
                  <div style={{ paddingTop: 2 }}>
                    <span className={`sev sev-${inc.severity}`}>{inc.severity}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, color: "#C4CDD9", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{inc.title}</div>
                    <div style={{ fontSize: 11, color: "#4E5A6B", marginTop: 2 }}>
                      {inc.service_name ?? "Platform"} · {new Date(inc.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: "#FCD34D",
                    background: "rgba(245,158,11,0.1)", borderRadius: 99, padding: "2px 7px",
                    whiteSpace: "nowrap",
                  }}>{inc.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Deployments */}
        <div className="panel">
          <div className="panel-header">
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Rocket size={14} style={{ color: "#8B5CF6" }} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: "#E8ECF4" }}>Recent Deployments</span>
            </div>
            <Link href="/deployments">
              <span style={{ fontSize: 11, color: "#3B82F6", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                View all <ArrowUpRight size={11} />
              </span>
            </Link>
          </div>
          {deployments.length === 0 ? (
            <div style={{ padding: "32px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#4E5A6B" }}>No deployments yet</div>
              <Link href="/deployments">
                <div style={{ fontSize: 11, color: "#3B82F6", marginTop: 6, cursor: "pointer" }}>Create first deployment →</div>
              </Link>
            </div>
          ) : (
            <div>
              {deployments.slice(0, 6).map((dep: any) => {
                const ds = DEP_STATUS[dep.status] ?? { color: "#4E5A6B", dot: "#252D3A" };
                return (
                  <div key={dep.id} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 16px", borderBottom: "1px solid #111318",
                  }}>
                    <span className="dot" style={{ background: ds.dot, boxShadow: `0 0 5px ${ds.dot}80`, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span className="mono" style={{ fontSize: 12, color: "#E8ECF4", fontWeight: 500 }}>{dep.version}</span>
                        <span className={`env env-${dep.environment}`}>{dep.environment}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#4E5A6B", marginTop: 1 }}>
                        {dep.service_name ?? "—"} · {dep.deployed_by ?? "—"}
                      </div>
                    </div>
                    <span style={{ fontSize: 12, color: ds.color, fontWeight: 600, whiteSpace: "nowrap" }}>{dep.status}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Platform grid */}
      <div className="panel" style={{ overflow: "hidden" }}>
        <div className="panel-header" style={{ background: "rgba(59,130,246,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3B82F6" }} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "#E8ECF4" }}>Platform Capabilities — Phase 1</span>
          </div>
          <span style={{ fontSize: 11, color: "#4E5A6B" }}>SyncOps AI · Observability Foundation</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
          {[
            { title: "Service Catalog", desc: "Health, ownership, tier & metadata per service.", icon: Server, color: "#60A5FA", href: "/services" },
            { title: "Structured Logs", desc: "Filterable log stream with trace correlation.", icon: ScrollText, color: "#4E5A6B", href: "/logs" },
            { title: "Metrics", desc: "Latency, error rate & throughput area charts.", icon: BarChart3, color: "#F59E0B", href: "/metrics" },
            { title: "Incidents", desc: "Severity lifecycle with RCA linkage.", icon: AlertTriangle, color: "#EF4444", href: "/incidents" },
            { title: "Deployments", desc: "Version audit trail with rollback tracking.", icon: Rocket, color: "#8B5CF6", href: "/deployments" },
            { title: "AI Copilot", desc: "Operational Q&A — Phase 4 RAG pipeline.", icon: Zap, color: "#3B82F6", href: "/copilot" },
          ].map((p, i) => (
            <Link key={p.title} href={p.href}>
              <div style={{
                padding: "14px 18px",
                borderRight: i % 3 !== 2 ? "1px solid #111318" : "none",
                borderBottom: i < 3 ? "1px solid #111318" : "none",
                transition: "background 0.12s",
                cursor: "pointer",
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#0F1116"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                  <p.icon size={13} style={{ color: p.color }} />
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: "#C4CDD9" }}>{p.title}</span>
                </div>
                <p style={{ fontSize: 11.5, color: "#4E5A6B", lineHeight: 1.5 }}>{p.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
