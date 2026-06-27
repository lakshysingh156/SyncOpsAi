import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, RefreshCw, Zap, ChevronRight, ChevronDown } from "lucide-react";

interface LogEntry {
  id: string; service_id: string | null; service_name: string | null;
  level: string; message: string; trace_id: string | null;
  metadata: string | null; timestamp: string;
}

const LEVEL_COLOR: Record<string, string> = { debug: "#4E5A6B", info: "#60A5FA", warn: "#FBBF24", error: "#F87171" };
const LEVEL_BG: Record<string, string> = {
  debug: "rgba(78,90,107,0.08)",
  info: "rgba(59,130,246,0.08)",
  warn: "rgba(245,158,11,0.08)",
  error: "rgba(239,68,68,0.08)",
};
const LEVEL_BORDER: Record<string, string> = {
  debug: "#252D3A",
  info: "#3B82F6",
  warn: "#F59E0B",
  error: "#EF4444",
};

const PILL_STYLE = (level: string, active: boolean): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "4px 10px", borderRadius: 4, cursor: "pointer",
  fontSize: 11.5, fontWeight: 500, border: "1px solid",
  background: active ? LEVEL_BG[level] : "transparent",
  color: active ? LEVEL_COLOR[level] : "#4E5A6B",
  borderColor: active ? LEVEL_BORDER[level] + "60" : "#1C2029",
  transition: "all 0.15s",
});

function timeAgo(ts: string) {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function LogsPage() {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: logs = [], isLoading, refetch } = useQuery<LogEntry[]>({
    queryKey: ["logs", level, search],
    queryFn: () => {
      const p = new URLSearchParams();
      if (level) p.set("level", level);
      if (search) p.set("search", search);
      p.set("limit", "200");
      return fetch(`/api/logs?${p}`).then(r => r.json());
    },
    refetchInterval: 15_000,
  });

  const genDemo = useMutation({
    mutationFn: () => fetch("/api/logs/generate-demo-data", { method: "POST" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["logs"] }),
  });

  const counts = { debug: 0, info: 0, warn: 0, error: 0 } as Record<string, number>;
  logs.forEach(l => { if (l.level in counts) counts[l.level]++; });

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: "#E8ECF4", letterSpacing: "-0.02em" }}>Logs</h1>
          <p style={{ fontSize: 12, color: "#4E5A6B", marginTop: 2 }}>
            Structured log stream — <span className="mono" style={{ color: "#8896AB" }}>{logs.length}</span> entries
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-sm btn-outline-blue" onClick={() => genDemo.mutate()} disabled={genDemo.isPending}>
            <Zap size={12} />{genDemo.isPending ? "…" : "Ingest Demo Logs"}
          </button>
          <button className="btn btn-sm btn-ghost" onClick={() => refetch()}>
            <RefreshCw size={12} style={{ animation: isLoading ? "spin 1s linear infinite" : "none" }} />
          </button>
        </div>
      </div>

      {/* Level pills */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {(["debug", "info", "warn", "error"] as const).map(lvl => (
          <button key={lvl} style={PILL_STYLE(lvl, level === lvl)} onClick={() => setLevel(level === lvl ? "" : lvl)}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: LEVEL_COLOR[lvl], display: "inline-block" }} />
            {lvl}
            <span className="mono" style={{ color: LEVEL_COLOR[lvl], fontWeight: 600, fontSize: 11 }}>{counts[lvl]}</span>
          </button>
        ))}
        {(level || search) && (
          <button className="btn btn-sm btn-ghost" onClick={() => { setLevel(""); setSearch(""); }} style={{ marginLeft: 4 }}>
            Clear filters
          </button>
        )}
      </div>

      {/* Search + filter row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 400 }}>
          <Search size={12} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#4E5A6B" }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Filter by message content…"
            className="field field-sm"
            style={{ width: "100%", paddingLeft: 27 }}
          />
        </div>
        <select
          value={level} onChange={e => setLevel(e.target.value)}
          className="field field-sm"
          style={{ width: 120 }}
        >
          <option value="">All levels</option>
          {["debug", "info", "warn", "error"].map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {/* Log table */}
      <div className="panel" style={{ overflow: "hidden" }}>
        {/* Column header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "36px 70px 140px 130px 1fr 130px 32px",
          gap: 0, padding: "7px 14px",
          borderBottom: "1px solid #1C2029",
          background: "#0C0E12",
        }}>
          {["LVL", "AGO", "TIME", "SERVICE", "MESSAGE", "TRACE ID", ""].map((h, i) => (
            <span key={i} style={{ fontSize: 10, fontWeight: 600, color: "#2E3848", letterSpacing: "0.07em", textTransform: "uppercase" }}>{h}</span>
          ))}
        </div>

        {isLoading ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "#4E5A6B", fontSize: 12 }}>Loading logs…</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "#4E5A6B" }}>No logs found.</div>
            <button className="btn btn-sm btn-outline-blue" style={{ marginTop: 12 }} onClick={() => genDemo.mutate()}>
              <Zap size={11} /> Generate demo logs
            </button>
          </div>
        ) : (
          <div style={{ maxHeight: 600, overflowY: "auto" }}>
            {logs.map(log => (
              <div key={log.id}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "36px 70px 140px 130px 1fr 130px 32px",
                    padding: "8px 14px",
                    borderBottom: "1px solid #0F1116",
                    borderLeft: `2px solid ${LEVEL_BORDER[log.level] ?? "#252D3A"}`,
                    cursor: "pointer",
                    transition: "background 0.1s",
                    alignItems: "center",
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#0F1116"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                  onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                >
                  <span className={`loglevel loglevel-${log.level}`}>{log.level.toUpperCase().slice(0, 4)}</span>
                  <span className="mono" style={{ fontSize: 11, color: "#4E5A6B" }}>{timeAgo(log.timestamp)}</span>
                  <span className="mono" style={{ fontSize: 10.5, color: "#4E5A6B" }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span style={{ fontSize: 11.5, color: "#8896AB", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {log.service_name ?? "—"}
                  </span>
                  <span style={{ fontSize: 12, color: "#C4CDD9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {log.message}
                  </span>
                  <span className="mono" style={{ fontSize: 10.5, color: "#4E5A6B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {log.trace_id ? log.trace_id.slice(0, 14) + "…" : "—"}
                  </span>
                  {expanded === log.id ? <ChevronDown size={12} style={{ color: "#4E5A6B" }} /> : <ChevronRight size={12} style={{ color: "#4E5A6B" }} />}
                </div>
                {expanded === log.id && (
                  <div style={{ background: "#0A0C10", borderBottom: "1px solid #1C2029", padding: "12px 16px 14px 52px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 10 }}>
                      {[
                        { label: "Full Timestamp", val: new Date(log.timestamp).toISOString() },
                        { label: "Trace ID", val: log.trace_id ?? "—" },
                        { label: "Service", val: log.service_name ?? "—" },
                      ].map(({ label, val }) => (
                        <div key={label}>
                          <div style={{ fontSize: 10, color: "#4E5A6B", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 3 }}>{label}</div>
                          <div className="mono" style={{ fontSize: 11.5, color: "#8896AB" }}>{val}</div>
                        </div>
                      ))}
                    </div>
                    {log.metadata && (
                      <div>
                        <div style={{ fontSize: 10, color: "#4E5A6B", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Metadata</div>
                        <pre className="mono" style={{ fontSize: 11, color: "#8896AB", background: "#07090C", borderRadius: 4, padding: "8px 12px", border: "1px solid #1C2029", overflowX: "auto" }}>
                          {JSON.stringify(JSON.parse(log.metadata), null, 2)}
                        </pre>
                      </div>
                    )}
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
