import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Filter, RefreshCw, Download, Zap, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogEntry {
  id: string;
  service_id: string | null;
  service_name: string | null;
  level: string;
  message: string;
  trace_id: string | null;
  metadata: string | null;
  timestamp: string;
}

const LEVELS = ["", "debug", "info", "warn", "error"] as const;
const LEVEL_COLORS: Record<string, string> = {
  debug: "text-muted bg-muted/10 border-muted/20",
  info: "text-info bg-info/10 border-info/20",
  warn: "text-warn bg-warn/10 border-warn/20",
  error: "text-danger bg-danger/10 border-danger/20",
};
const LEVEL_BADGE: Record<string, string> = {
  debug: "text-muted",
  info: "text-info",
  warn: "text-warn",
  error: "text-danger",
};
const LEVEL_ROW: Record<string, string> = {
  debug: "log-row-debug",
  info: "log-row-info",
  warn: "log-row-warn",
  error: "log-row-error",
};

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function LogsPage() {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: logs = [], isLoading, refetch } = useQuery<LogEntry[]>({
    queryKey: ["logs", level, search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (level) params.set("level", level);
      if (search) params.set("search", search);
      params.set("limit", "200");
      return fetch(`/api/logs?${params}`).then(r => r.json());
    },
    refetchInterval: 15_000,
  });

  const generateDemo = useMutation({
    mutationFn: () => fetch("/api/logs/generate-demo-data", { method: "POST" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["logs"] }),
  });

  const counts = {
    debug: logs.filter(l => l.level === "debug").length,
    info: logs.filter(l => l.level === "info").length,
    warn: logs.filter(l => l.level === "warn").length,
    error: logs.filter(l => l.level === "error").length,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Logs</h1>
          <p className="mt-0.5 text-sm text-muted">Structured log stream — {logs.length} entries</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => generateDemo.mutate()}
            disabled={generateDemo.isPending}
            className="flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 transition-colors"
          >
            <Zap className="h-3 w-3" />
            {generateDemo.isPending ? "…" : "Generate Logs"}
          </button>
          <button
            onClick={() => refetch()}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted hover:bg-surface-2 transition-colors"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Level summary pills */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(counts).map(([lvl, n]) => (
          <button
            key={lvl}
            onClick={() => setLevel(level === lvl ? "" : lvl)}
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-all",
              level === lvl ? LEVEL_COLORS[lvl] : "border-border text-muted hover:border-border-2 hover:text-foreground",
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", {
              "bg-muted": lvl === "debug",
              "bg-info": lvl === "info",
              "bg-warn": lvl === "warn",
              "bg-danger": lvl === "error",
            })} />
            {lvl} <span className="font-mono">{n}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter by message…"
            className="h-8 w-full rounded-md border border-border bg-surface pl-8 pr-3 text-xs text-foreground placeholder:text-muted focus:border-accent/60 focus:outline-none"
          />
        </div>
        <select
          value={level}
          onChange={e => setLevel(e.target.value)}
          className="h-8 rounded-md border border-border bg-surface px-2 text-xs text-foreground focus:outline-none"
        >
          {LEVELS.map(l => <option key={l} value={l}>{l || "All levels"}</option>)}
        </select>
        {(level || search) && (
          <button onClick={() => { setLevel(""); setSearch(""); }} className="h-8 px-2 text-xs text-muted hover:text-foreground transition-colors">
            Clear
          </button>
        )}
      </div>

      {/* Log stream */}
      <div className="card overflow-hidden font-mono text-xs">
        {/* Header row */}
        <div className="flex items-center gap-4 border-b border-border bg-surface-2 px-4 py-2 text-[10px] uppercase tracking-widest text-muted">
          <span className="w-12">Level</span>
          <span className="w-36">Timestamp</span>
          <span className="w-24">Service</span>
          <span className="flex-1">Message</span>
          <span className="w-28">Trace ID</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted text-sm font-sans">Loading logs…</div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <p className="font-sans text-sm text-muted">No logs found.</p>
            <button
              onClick={() => generateDemo.mutate()}
              className="font-sans text-xs text-accent hover:underline"
            >
              Generate demo log data →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border/50 max-h-[600px] overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id}>
                <button
                  className={cn(
                    "flex w-full items-start gap-4 px-4 py-2 text-left hover:bg-surface-2/70 transition-colors pl-3",
                    LEVEL_ROW[log.level] ?? "border-l-2 border-transparent",
                  )}
                  onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                >
                  <span className={cn("w-12 shrink-0 font-semibold uppercase text-[10px] pt-0.5", LEVEL_BADGE[log.level])}>{log.level}</span>
                  <span className="w-36 shrink-0 text-muted pt-0.5">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className="w-24 shrink-0 truncate text-muted/80 pt-0.5">{log.service_name ?? "—"}</span>
                  <span className="flex-1 min-w-0 truncate text-foreground/90 pt-0.5">{log.message}</span>
                  <span className="w-28 shrink-0 truncate text-muted/60 pt-0.5">{log.trace_id ? log.trace_id.slice(0, 12) + "…" : "—"}</span>
                  <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 text-muted transition-transform mt-0.5", expanded === log.id && "rotate-90")} />
                </button>
                {expanded === log.id && (
                  <div className="border-t border-border bg-surface-2/50 px-4 py-3 font-sans">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-muted mb-1">Trace ID</p>
                        <p className="font-mono text-foreground">{log.trace_id ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-muted mb-1">Service</p>
                        <p>{log.service_name ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-muted mb-1">Timestamp</p>
                        <p className="font-mono">{new Date(log.timestamp).toISOString()}</p>
                      </div>
                      <div>
                        <p className="text-muted mb-1">Time ago</p>
                        <p>{timeAgo(log.timestamp)}</p>
                      </div>
                      {log.metadata && (
                        <div className="col-span-2">
                          <p className="text-muted mb-1">Metadata</p>
                          <pre className="rounded bg-canvas p-2 text-[11px] overflow-x-auto">{JSON.stringify(JSON.parse(log.metadata), null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
