import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Server, ScrollText, BarChart3,
  AlertTriangle, Rocket, Cpu, Sparkles, GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

const NAV = [
  { href: "/",            label: "Overview",    icon: LayoutDashboard },
  { href: "/services",    label: "Services",    icon: Server },
  { href: "/logs",        label: "Logs",        icon: ScrollText },
  { href: "/metrics",     label: "Metrics",     icon: BarChart3 },
  { href: "/incidents",   label: "Incidents",   icon: AlertTriangle, alertKey: true },
  { href: "/deployments", label: "Deployments", icon: Rocket },
  { href: "/tracing",     label: "Tracing",     icon: GitBranch },
  { href: "/insights",    label: "AI Insights", icon: Sparkles, badge: "AI" },
] as const;

export function Sidebar() {
  const [pathname] = useLocation();

  const { data: summary } = useQuery<any>({
    queryKey: ["dashboard-summary"],
    queryFn: () => fetch("/api/dashboard/summary").then(r => r.json()),
    refetchInterval: 30_000,
  });

  const openIncidents: number = summary?.open_incidents ?? 0;
  const healthy = summary?.healthy_services ?? 0;
  const total   = summary?.total_services   ?? 0;

  return (
    <aside
      style={{
        width: 208,
        minWidth: 208,
        background: "#06080B",
        borderRight: "1px solid #181D26",
        height: "100vh",
        position: "sticky",
        top: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Workspace / logo */}
      <div style={{ padding: "14px 12px 10px", borderBottom: "1px solid #181D26" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{
            width: 28, height: 28,
            background: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)",
            borderRadius: 7,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 0 12px rgba(37,99,235,0.3)",
          }}>
            <Cpu size={14} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#EAECF0", letterSpacing: "-0.015em", lineHeight: 1.2 }}>SyncOps AI</div>
            <div style={{ fontSize: 10.5, color: "#404C5C", marginTop: 1 }}>Observability Platform</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 6px", overflowY: "auto" }}>
        <div className="nav-section-label">Platform</div>
        {NAV.map(({ href, label, icon: Icon, alertKey, badge }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          const showAlert = alertKey && openIncidents > 0;
          return (
            <Link key={href} href={href}>
              <div className={cn("nav-item", active && "active")} style={{ marginBottom: 1 }}>
                <Icon
                  size={14}
                  style={{
                    flexShrink: 0,
                    color: active ? "#60A5FA" : showAlert ? "#F87171" : "inherit",
                  }}
                />
                <span style={{ flex: 1, fontSize: 13, fontWeight: active ? 500 : 400 }}>{label}</span>
                {showAlert && (
                  <span className="badge-critical">{openIncidents > 9 ? "9+" : openIncidents}</span>
                )}
                {badge && !showAlert && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
                    background: "rgba(139,92,246,0.12)", color: "#A78BFA",
                    border: "1px solid rgba(139,92,246,0.2)",
                    borderRadius: 3, padding: "1px 5px",
                  }}>{badge}</span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "10px 12px", borderTop: "1px solid #181D26" }}>
        {/* System health line */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <span
            className="dot"
            style={{
              background: openIncidents > 0 ? "#EF4444" : "#10B981",
              boxShadow: openIncidents > 0
                ? "0 0 6px rgba(239,68,68,0.4)"
                : "0 0 6px rgba(16,185,129,0.4)",
              animation: "dot-pulse 2.4s ease-in-out infinite",
            }}
          />
          <span style={{ fontSize: 11, color: "#404C5C" }}>
            {openIncidents > 0
              ? `${openIncidents} incident${openIncidents > 1 ? "s" : ""} open`
              : total > 0
                ? `${healthy}/${total} services healthy`
                : "Awaiting data"}
          </span>
        </div>

        {/* User */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: "50%",
            background: "linear-gradient(135deg, #1D4ED8, #7C3AED)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 700, color: "#fff",
            flexShrink: 0,
          }}>L</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, color: "#C1CAD6", fontWeight: 500, letterSpacing: "-0.01em" }}>lakshay.singh</div>
            <div style={{ fontSize: 10, color: "#404C5C" }}>Admin · v0.1.0</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
