"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  LayoutDashboard,
  Rocket,
  ScrollText,
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
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface/60 px-3 py-5 md:flex">
      <div className="mb-7 flex items-center gap-2.5 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
          S
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">SyncOps AI</div>
          <div className="text-[11px] text-muted">Observability</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent/15 text-foreground"
                  : "text-muted hover:bg-surface-2 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 rounded-lg border border-border bg-surface-2/60 px-3 py-2.5 text-[11px] text-muted">
        MVP build · v0.1.0
      </div>
    </aside>
  );
}
