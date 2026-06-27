import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Server, ScrollText, BarChart3,
  AlertTriangle, Rocket, Bot, ChevronRight,
  Zap, Circle,
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
  { href: "/copilot",     label: "AI Copilot",  icon: Bot, badge: "AI" },
] as const;

export function Sidebar() {
  const [pathname] = useLocation();

  const { data: summary } = useQuery<any>({
    queryKey: ["dashboard-summary"],
    queryFn: () => fetch("/api/dashboard/summary").then(r => r.json()),
    refetchInterval: 30_000,
  });

  const openIncidents: number = summary?.open_incidents ?? 0;
  const criticalIncidents: number = summary?.critical_incidents ?? 0;

  return (
    <aside
      className="hidden md:flex flex-col"
      style={{
        width: 220,
        minWidth: 220,
        background: "#070A0E",
        borderRight: "1px solid #141820",
        height: "100vh",
        position: "sticky",
        top: 0,
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid #141820" }}>
        <div className="flex items-center gap-2.5">
          <div style={{
            width: 30, height: 30,
            background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
            borderRadius: 7,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 16px rgba(37,99,235,0.35)",
          }}>
            <Zap size={15} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#E8ECF4", letterSpacing: "-0.01em" }}>SyncOps AI</div>
            <div style={{ fontSize: 10, color: "#3B82F6", fontWeight: 500, letterSpacing: "0.04em" }}>OBSERVABILITY</div>
          </div>
        </div>
      </div>

      {/* System status */}
      <div style={{ padding: "10px 14px", borderBottom: "1px solid #141820" }}>
        <div className="flex items-center gap-2">
          <span className="dot dot-green dot-pulse" />
          <span style={{ fontSize: 11, color: "#8896AB" }}>All systems operational</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "10px 8px", overflow: "hidden" }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: "#2E3848", letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 12px 8px" }}>
          Platform
        </div>
        {NAV.map(({ href, label, icon: Icon, alertKey, badge }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          const showAlert = alertKey && openIncidents > 0;
          return (
            <Link key={href} href={href}>
              <div className={cn("nav-item", active && "active")} style={{ marginBottom: 1 }}>
                <Icon size={15} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, fontWeight: active ? 500 : 400 }}>{label}</span>
                {showAlert && (
                  <span className="badge-critical">{openIncidents > 9 ? "9+" : openIncidents}</span>
                )}
                {badge && !showAlert && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: "0.05em",
                    background: "rgba(59,130,246,0.15)", color: "#60A5FA",
                    border: "1px solid rgba(59,130,246,0.25)",
                    borderRadius: 3, padding: "1px 4px",
                  }}>{badge}</span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "10px 14px", borderTop: "1px solid #141820" }}>
        {criticalIncidents > 0 && (
          <div style={{
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)",
            borderRadius: 5, padding: "7px 10px", marginBottom: 10,
          }}>
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={11} color="#F87171" />
              <span style={{ fontSize: 11, color: "#F87171", fontWeight: 500 }}>
                {criticalIncidents} critical incident{criticalIncidents > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2.5">
          <div style={{
            width: 26, height: 26, borderRadius: "50%",
            background: "linear-gradient(135deg, #1D4ED8, #7C3AED)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: "#fff",
          }}>L</div>
          <div>
            <div style={{ fontSize: 12, color: "#C4CDD9", fontWeight: 500 }}>lakshay.singh</div>
            <div style={{ fontSize: 10, color: "#4E5A6B" }}>Admin · v0.1.0</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
