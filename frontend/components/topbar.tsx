import { Search } from "lucide-react";

export function Topbar() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-canvas/80 px-6 backdrop-blur lg:px-8">
      <div className="flex items-center gap-2 text-sm text-muted">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            disabled
            placeholder="Search services, logs, incidents…"
            className="w-72 rounded-lg border border-border bg-surface py-1.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-ok" />
          Production
        </span>
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-accent to-accent-hover" />
      </div>
    </header>
  );
}
