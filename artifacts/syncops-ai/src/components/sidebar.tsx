import { Link, useLocation } from "wouter";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  LayoutDashboard,
  Rocket,
  ScrollText,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/services", label: "Services", icon: Activity },
  { href: "/logs", label: "Logs", icon: ScrollText },
  { href: "/metrics", label: "Metrics", icon: BarChart3 },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/deployments", label: "Deployments", icon: Rocket },
  { href: "/copilot", label: "AI Copilot", icon: Bot },
] as const;

export function Sidebar() {
  const [pathname] = useLocation();

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-canvas px-3 py-5 md:flex">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent shadow-lg shadow-accent/30">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight">SyncOps AI</div>
          <div className="text-[11px] text-muted">Observability</div>
        </div>
      </div>

      {/* Nav label */}
      <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted/60">
        Platform
      </div>

      <nav className="flex flex-1 flex-col gap-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-150",
                active
                  ? "bg-accent/15 text-foreground font-medium"
                  : "text-muted hover:bg-surface-2 hover:text-foreground",
              )}
            >
              <Icon className={cn("h-[15px] w-[15px]", active ? "text-accent" : "")} />
              {label}
              {href === "/incidents" && (
                <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-danger/20 text-[10px] font-semibold text-danger">!</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-border pt-4">
        <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
          <div className="h-6 w-6 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">L</div>
          <div className="text-xs text-muted">lakshay.singh</div>
        </div>
        <div className="mt-1 px-3 text-[10px] text-muted/50">v0.1.0 · production</div>
      </div>
    </aside>
  );
}
