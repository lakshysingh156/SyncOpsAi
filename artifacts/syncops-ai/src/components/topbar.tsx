import { useState } from "react";
import { Search, Bell, Settings, ChevronDown } from "lucide-react";

export function Topbar() {
  const [search, setSearch] = useState("");

  return (
    <header className="flex h-12 items-center gap-3 border-b border-border bg-canvas/90 px-6 backdrop-blur-sm sticky top-0 z-10">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search services, logs, incidents…"
          className="h-7 w-full rounded-md border border-border bg-surface pl-8 pr-3 text-xs text-foreground placeholder:text-muted focus:border-accent/60 focus:outline-none focus:ring-1 focus:ring-accent/20"
        />
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1 text-xs">
        <span className="h-1.5 w-1.5 rounded-full bg-ok animate-pulse" />
        <span className="text-muted">production</span>
        <ChevronDown className="h-3 w-3 text-muted" />
      </div>
      <button className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-foreground transition-colors">
        <Bell className="h-3.5 w-3.5" />
      </button>
      <button className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-foreground transition-colors">
        <Settings className="h-3.5 w-3.5" />
      </button>
      <div className="h-7 w-7 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent border border-accent/30 cursor-pointer">L</div>
    </header>
  );
}
