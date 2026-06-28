import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Server, AlertTriangle, Rocket, TrendingUp, BarChart3,
  ScrollText, RefreshCw, Zap, ArrowUpRight, CheckCircle,
  Sparkles, Activity, Clock,
} from "lucide-react";
import { Link } from "wouter";

interface DashboardSummary {
  total_services: number; healthy_services: number;
  open_incidents: number; critical_incidents: number;
  recent_deployments: number; failed_deployments: number;
  avg_error_rate: number; avg_latency: number;
  total_logs_24h: number; error_logs_24h: number;
}

function timeSince(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const INC_COLOR: Record<string, string> = {
  critical: "#F87171", high: "#FB923C", medium: "#FCD34D", low: "#A5B4FC"
};

const DEP_DOT: Record<string, string> = {
  success: "#10B981", failed: "#EF4444", running: "#3B82F6",
  rolled_back: "#F59E0B", pending: "#404C5C",
};

function getAiSummary(D: DashboardSummary | undefined, incidents: any[], deployments: any[]) {
  if (!D) return "Awaiting telemetry data — generate demo data to see AI operational analysis.";

  const critical = incidents.filter(i => i.severity === "critical");
  const high     = incidents.filter(i => i.severity === "high");
  const failed   = deployments.filter(d => d.status === "failed" || d.status === "rolled_back");

  if (critical.length > 0) {
    const top = critical[0];
    const dep = failed[0];
    return `P0 active: "${top.title}". ${D.avg_latency > 200 ? `Average P99 latency is elevated at ${D.avg_latency.toFixed(0)}ms across all services. ` : ""}${dep ? `Deployment ${dep.version} on ${dep.service_name} ${dep.status === "failed" ? "failed" : "was rolled back"} — correlated with current incident spike. ` : ""}${high.length > 0 ? `${high.length} additional high-severity incident${high.length > 1 ? "s" : ""} require attention. ` : ""}Recommend immediate incident triage before next deployment window.`;
  }

  if (D.open_incidents > 0) {
    return `${D.open_incidents} open incident${D.open_incidents > 1 ? "s" : ""} across the platform. Error rate at ${D.avg_error_rate?.toFixed(2) ?? "—"}% — ${D.avg_error_rate > 2 ? "above threshold, investigation recommended" : "within acceptable range"}. ${D.avg_latency ? `P99 latency at ${D.avg_latency.toFixed(0)}ms.` : ""} ${failed.length > 0 ? `${failed.length} recent deployment${failed.length > 1 ? "s" : ""} failed or rolled back.` : "All recent deployments succeeded."}`;
  }

  if (D.total_services === 0) {
    return "No services registered. Add services to the catalog and generate demo data to enable AI operational analysis.";
  }

  return `All ${D.total_services} services operational. ${D.healthy_services} reporting healthy. Error rate ${D.avg_error_rate?.toFixed(2) ?? "0.00"}% · P99 latency ${D.avg_latency?.toFixed(0) ?? "—"}ms — both within normal bounds. ${D.recent_deployments} deployments in the last 7 days with ${D.failed_deployments === 0 ? "100% success rate" : `${D.failed_deployments} failure${D.failed_deployments > 1 ? "s" : ""}`}.`;
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
  const aiSummary = getAiSummary(D, incidents, deployments);
  const hasData = (D?.total_services ?? 0) > 0;

  return (
    <div style={{ maxWidth: 1260, margin: "0 auto" }} className="fade-in">

      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Overview</h1>
          <p className="page-sub">Operational intelligence across all services</p>
        </div>
        <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
          <button
            className="btn btn-sm btn-outline-blue"
            onClick={() => genDemo.mutate()}
            disabled={genDemo.isPending}
          >
            <Zap size={11} />
            {genDemo.isPending ? "Generating…" : "Generate Demo Data"}
          </button>
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => qc.invalidateQueries()}
            title="Refresh"
          >
            <RefreshCw
              size={13}
              style={{
                color: "#7A8899",
                animation: isLoading ? "spin 1s linear infinite" : "none",
              }}
            />
          </button>
        </div>
      </div>

      {/* Metric strip — unified horizontal surface */}
      <div className="metric-strip">
          {[
            {
              label: "Services",
              value: isLoading ? "—" : D?.total_services ?? 0,
              sub: D ? `${D.healthy_services} healthy · ${(D.total_services - D.healthy_services)} degraded` : "no data",
              icon: Server,
              href: "/services",
              accent: "#60A5FA",
            },
            {
              label: "Open Incidents",
              value: isLoading ? "—" : D?.open_incidents ?? 0,
              sub: D?.critical_incidents ? `${D.critical_incidents} critical` : "none critical",
              icon: AlertTriangle,
              href: "/incidents",
              accent: D?.open_incidents ? "#F87171" : "#34D399",
            },
            {
              label: "Deployments (7d)",
              value: isLoading ? "—" : D?.recent_deployments ?? 0,
              sub: D?.failed_deployments ? `${D.failed_deployments} failed` : "all succeeded",
              icon: Rocket,
              href: "/deployments",
              accent: "#A78BFA",
            },
            {
              label: "Avg P99 Latency",
              value: isLoading ? "—" : D?.avg_latency ? `${D.avg_latency.toFixed(0)}ms` : "—",
              sub: "last 24 hours",
              icon: Activity,
              href: "/metrics",
              accent: D?.avg_latency && D.avg_latency > 200 ? "#FBBF24" : "#34D399",
            },
            {
              label: "Error Rate",
              value: isLoading ? "—" : D?.avg_error_rate ? `${D.avg_error_rate.toFixed(2)}%` : "—",
              sub: "all services",
              icon: BarChart3,
              href: "/metrics",
              accent: D?.avg_error_rate && D.avg_error_rate > 2 ? "#F87171" : "#34D399",
            },
            {
              label: "Log Events (24h)",
              value: isLoading ? "—" : D?.total_logs_24h ?? 0,
              sub: D?.error_logs_24h ? `${D.error_logs_24h} errors` : "no errors",
              icon: ScrollText,
              href: "/logs",
              accent: "#7A8899",
            },
          ].map(({ label, value, sub, icon: Icon, href, accent }) => (
            <Link key={label} href={href}>
              <div className="metric-item">
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                  <span className="metric-label" style={{ marginBottom: 0 }}>{label}</span>
                  <Icon size={11} style={{ color: accent, marginLeft: "auto" }} />
                </div>
                <span className="metric-value" style={{ color: value === "—" ? "#404C5C" : "#EAECF0" }}>
                  {value}
                </span>
                <span className="metric-sub">{sub}</span>
              </div>
            </Link>
          ))}
      </div>

      {/* AI Analysis block */}
      <div className="ai-block">
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
          <Sparkles size={13} style={{ color: "#60A5FA" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "#60A5FA", letterSpacing: "0.03em" }}>AI Analysis</span>
          <span style={{
            fontSize: 9.5, color: "#404C5C", fontWeight: 500,
            background: "#0F1215", border: "1px solid #181D26",
            borderRadius: 3, padding: "1px 6px", marginLeft: "auto",
          }}>
            GPT-4o · demo mode
          </span>
        </div>
        <p style={{ fontSize: 13, color: "#C1CAD6", lineHeight: 1.65, maxWidth: 900 }}>
          {aiSummary}
        </p>
      </div>

      {/* Incidents + Deployments */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        {/* Open Incidents */}
        <div className="panel">
          <div className="panel-header">
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <AlertTriangle size={13} style={{ color: "#F87171" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#EAECF0" }}>Open Incidents</span>
              {incidents.length > 0 && (
                <span style={{
                  background: "rgba(239,68,68,0.1)", color: "#F87171",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: 99, padding: "0 6px", fontSize: 10.5, fontWeight: 600,
                }}>
                  {incidents.length}
                </span>
              )}
            </div>
            <Link href="/incidents">
              <span style={{ fontSize: 11, color: "#3B82F6", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                View all <ArrowUpRight size={10} />
              </span>
            </Link>
          </div>

          {incidents.length === 0 ? (
            <div style={{ padding: "36px 20px", textAlign: "center" }}>
              <CheckCircle size={20} style={{ color: "#10B981", margin: "0 auto 8px", display: "block" }} />
              <div style={{ fontSize: 13, color: "#34D399", fontWeight: 500 }}>All clear</div>
              <div style={{ fontSize: 11, color: "#404C5C", marginTop: 3 }}>No open incidents</div>
            </div>
          ) : (
            incidents.slice(0, 6).map((inc: any) => (
              <div key={inc.id} className="timeline-row">
                <div style={{ paddingTop: 1 }}>
                  <span className={`sev sev-${inc.severity}`}>{inc.severity.slice(0, 3)}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12.5, color: "#C1CAD6", fontWeight: 500,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    marginBottom: 2,
                  }}>
                    {inc.title}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#404C5C" }}>
                    <Clock size={9} />
                    {inc.service_name ?? "Platform"} · {timeSince(inc.created_at)}
                  </div>
                </div>
                <span style={{
                  fontSize: 10.5, fontWeight: 500,
                  color: INC_COLOR[inc.severity] ?? "#7A8899",
                  opacity: 0.8,
                  flexShrink: 0,
                  alignSelf: "center",
                }}>
                  {inc.status}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Recent Deployments */}
        <div className="panel">
          <div className="panel-header">
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Rocket size={13} style={{ color: "#A78BFA" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#EAECF0" }}>Recent Deployments</span>
            </div>
            <Link href="/deployments">
              <span style={{ fontSize: 11, color: "#3B82F6", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                View all <ArrowUpRight size={10} />
              </span>
            </Link>
          </div>

          {deployments.length === 0 ? (
            <div style={{ padding: "36px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#404C5C" }}>No deployments yet.</div>
              <Link href="/deployments">
                <div style={{ fontSize: 11, color: "#3B82F6", marginTop: 6, cursor: "pointer" }}>
                  View deployments →
                </div>
              </Link>
            </div>
          ) : (
            deployments.slice(0, 6).map((dep: any) => {
              const dotColor = DEP_DOT[dep.status] ?? "#404C5C";
              return (
                <div key={dep.id} className="timeline-row">
                  <span
                    className="dot"
                    style={{
                      background: dotColor,
                      boxShadow: `0 0 5px ${dotColor}60`,
                      marginTop: 4,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <span className="mono" style={{ fontSize: 12, color: "#EAECF0", fontWeight: 500 }}>
                        {dep.version}
                      </span>
                      <span className={`env env-${dep.environment}`}>{dep.environment}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#404C5C" }}>
                      {dep.service_name ?? "—"} · {dep.deployed_by ?? "—"}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11.5, color: dotColor, fontWeight: 600,
                    whiteSpace: "nowrap", flexShrink: 0,
                  }}>
                    {dep.status}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Platform capabilities grid */}
      {!hasData && (
        <div className="panel" style={{ padding: "20px", textAlign: "center" }}>
          <TrendingUp size={20} style={{ color: "#404C5C", margin: "0 auto 10px", display: "block" }} />
          <div style={{ fontSize: 13, color: "#7A8899", fontWeight: 500, marginBottom: 4 }}>No data yet</div>
          <div style={{ fontSize: 12, color: "#404C5C", marginBottom: 14 }}>
            Generate demo data to populate the dashboard with realistic telemetry.
          </div>
          <button
            className="btn btn-sm btn-outline-blue"
            onClick={() => genDemo.mutate()}
            disabled={genDemo.isPending}
          >
            <Zap size={11} />
            {genDemo.isPending ? "Generating…" : "Generate Demo Data"}
          </button>
        </div>
      )}
    </div>
  );
}
