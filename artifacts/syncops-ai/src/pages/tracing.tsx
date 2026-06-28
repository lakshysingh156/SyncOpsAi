import { GitBranch, ArrowRight, Cpu, Clock, Activity } from "lucide-react";

const DEMO_TRACES = [
  {
    traceId: "8dd04e2c42381f",
    root: "api-gateway",
    duration: 2410,
    spans: 6,
    status: "error",
    time: "14:33:21",
    services: [
      { name: "api-gateway",     duration: 12,   status: "ok" },
      { name: "auth-service",    duration: 180,  status: "ok" },
      { name: "payment-service", duration: 2210, status: "error" },
      { name: "postgres",        duration: 2180, status: "timeout" },
    ],
  },
  {
    traceId: "f3a91bc88d204c",
    root: "api-gateway",
    duration: 44,
    spans: 4,
    status: "ok",
    time: "14:32:55",
    services: [
      { name: "api-gateway",  duration: 8,  status: "ok" },
      { name: "user-service", duration: 32, status: "ok" },
      { name: "redis",        duration: 4,  status: "ok" },
    ],
  },
  {
    traceId: "c20e74d5f18b39",
    root: "api-gateway",
    duration: 118,
    spans: 5,
    status: "ok",
    time: "14:32:41",
    services: [
      { name: "api-gateway",           duration: 6,   status: "ok" },
      { name: "recommendation-engine", duration: 108, status: "ok" },
      { name: "search-service",        duration: 95,  status: "ok" },
    ],
  },
];

const STATUS_COLOR: Record<string, string> = {
  ok: "#10B981", error: "#EF4444", timeout: "#F59E0B",
};

export default function TracingPage() {
  return (
    <div style={{ maxWidth: 1260, margin: "0 auto" }} className="fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Tracing</h1>
          <p className="page-sub">Distributed trace explorer — OpenTelemetry compatible</p>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.18)",
          borderRadius: 99, padding: "5px 12px", fontSize: 11, color: "#60A5FA",
        }}>
          <Activity size={11} />
          Phase 2 · Preview
        </div>
      </div>

      {/* Coming soon callout */}
      <div className="ai-block" style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
          <GitBranch size={13} style={{ color: "#60A5FA" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "#60A5FA", letterSpacing: "0.03em" }}>
            Phase 2 — Distributed Tracing
          </span>
        </div>
        <p style={{ fontSize: 12.5, color: "#7A8899", lineHeight: 1.6, maxWidth: 780 }}>
          Full OpenTelemetry trace ingestion is coming in Phase 2. This preview shows synthetic trace data
          with realistic span trees, error propagation, and latency breakdowns.
          The production implementation will include W3C TraceContext propagation, Jaeger-compatible trace explorer,
          and AI-powered anomaly detection on span latency distributions.
        </p>
      </div>

      {/* Trace list */}
      <div className="panel" style={{ overflow: "hidden" }}>
        <div className="panel-header">
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <GitBranch size={13} style={{ color: "#60A5FA" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#EAECF0" }}>Recent Traces</span>
            <span style={{
              fontSize: 10, color: "#404C5C", background: "#0F1215",
              border: "1px solid #181D26", borderRadius: 99, padding: "0 6px", fontWeight: 600,
            }}>
              synthetic
            </span>
          </div>
          <span style={{ fontSize: 11, color: "#404C5C" }}>Last 5 minutes</span>
        </div>

        {DEMO_TRACES.map(trace => (
          <div key={trace.traceId} style={{ borderBottom: "1px solid #0F1215" }}>
            {/* Trace header row */}
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 16px", cursor: "pointer", transition: "background 0.1s",
            }}
              onMouseEnter={e => (e.currentTarget as any).style.background = "rgba(255,255,255,0.015)"}
              onMouseLeave={e => (e.currentTarget as any).style.background = "transparent"}
            >
              <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: STATUS_COLOR[trace.status],
                boxShadow: `0 0 6px ${STATUS_COLOR[trace.status]}60`,
                flexShrink: 0,
              }} />
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11.5, color: "#60A5FA", minWidth: 120 }}>
                {trace.traceId}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 5, flex: 1, flexWrap: "wrap" }}>
                {trace.services.map((svc, i) => (
                  <div key={svc.name} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{
                      fontSize: 11, color: STATUS_COLOR[svc.status],
                      background: `${STATUS_COLOR[svc.status]}10`,
                      border: `1px solid ${STATUS_COLOR[svc.status]}20`,
                      borderRadius: 3, padding: "1px 6px", fontFamily: "JetBrains Mono, monospace",
                    }}>
                      {svc.name}
                    </span>
                    {i < trace.services.length - 1 && (
                      <ArrowRight size={10} style={{ color: "#252E3A" }} />
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", items: "center", gap: 16, flexShrink: 0 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#404C5C" }}>
                  <Clock size={10} />
                  {trace.time}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: trace.duration > 500 ? "#FBBF24" : "#34D399", letterSpacing: "-0.01em" }}>
                  {trace.duration}ms
                </span>
                <span style={{ fontSize: 11, color: "#404C5C" }}>
                  {trace.spans} spans
                </span>
              </div>
            </div>

            {/* Span breakdown bar */}
            <div style={{ padding: "0 16px 12px 36px" }}>
              <div style={{ display: "flex", height: 4, borderRadius: 2, overflow: "hidden", gap: 1 }}>
                {trace.services.map(svc => {
                  const pct = (svc.duration / trace.duration) * 100;
                  return (
                    <div
                      key={svc.name}
                      title={`${svc.name}: ${svc.duration}ms`}
                      style={{
                        width: `${pct}%`,
                        minWidth: pct < 1 ? 2 : 0,
                        background: STATUS_COLOR[svc.status],
                        opacity: svc.status === "ok" ? 0.5 : 0.9,
                        borderRadius: 2,
                        flexShrink: 0,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Phase 2 roadmap */}
      <div style={{ marginTop: 12 }} className="panel">
        <div className="panel-header">
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Cpu size={13} style={{ color: "#A78BFA" }} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "#EAECF0" }}>Tracing Roadmap — Phase 2</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
          {[
            { title: "OTel Ingest",         desc: "W3C TraceContext + B3 propagation headers. Accepts spans from any OpenTelemetry SDK.", status: "planned" },
            { title: "Flame Chart UI",       desc: "Interactive span tree with time-based waterfall chart and latency percentile breakdown.", status: "planned" },
            { title: "AI Anomaly Detection", desc: "ML-based detection of span latency outliers correlated with deployment events.", status: "planned" },
          ].map((item, i) => (
            <div key={item.title} style={{
              padding: "14px 16px",
              borderRight: i < 2 ? "1px solid #181D26" : "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "#C1CAD6" }}>{item.title}</span>
                <span style={{
                  fontSize: 9.5, color: "#A78BFA", fontWeight: 600,
                  background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)",
                  borderRadius: 3, padding: "1px 5px", letterSpacing: "0.04em", textTransform: "uppercase",
                }}>
                  Phase 2
                </span>
              </div>
              <p style={{ fontSize: 11.5, color: "#404C5C", lineHeight: 1.55 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
