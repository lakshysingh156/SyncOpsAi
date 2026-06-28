import { useState, useRef, useEffect } from "react";
import {
  Send, Bot, User, Sparkles, AlertTriangle, BarChart3,
  ScrollText, Rocket, Brain, TrendingUp, Activity,
  ShieldAlert, GitMerge, Zap, Clock, ArrowRight, CheckCircle2,
} from "lucide-react";

interface Message {
  id: string; role: "user" | "assistant"; content: string; ts: Date;
}

const SUGGESTIONS = [
  { icon: AlertTriangle, label: "What are the current open incidents?",    color: "#F87171" },
  { icon: BarChart3,     label: "Show me services with high error rates",  color: "#FBBF24" },
  { icon: ScrollText,    label: "Summarize recent error logs",             color: "#60A5FA" },
  { icon: Rocket,        label: "Which deployment last caused an outage?", color: "#A78BFA" },
];

const MOCK: Record<string, string> = {
  default: `I'm SyncOps AI — your operational intelligence layer.

**What I analyze:**
• **Root Cause Analysis** — correlate logs, metrics, and incidents to identify blast radius
• **Deployment Risk Assessment** — detect regressions, flag unsafe promotes
• **Log Summarization** — surface error patterns across services with trace correlation
• **Incident Triage** — recommend severity, ownership, and remediation steps
• **Anomaly Detection** — flag P99 deviations and correlate with deployment timeline

> Phase 4 RAG pipeline connects live telemetry. Currently in demo mode — responses simulate production AI behavior.`,
  incidents: `## Open Incident Summary

**P0 — CRITICAL**
• **Payment service P99 latency spike (2.4s)**
  — Hypothesis: DB connection pool exhausted under load spike
  — Evidence: throughput ↑ 340%, connection_timeout errors in logs, deployment v2.2.0 deployed 4m prior
  — Action: \`kubectl rollout undo deploy/payment-service\` → monitor P99 recovery

**P1 — HIGH**
• **Auth service JWT validation failures (ERR_CERT_EXPIRED)**
  — Certificate expired 03:00 UTC, 12% of login requests failing
  — Action: \`kubectl create secret tls auth-tls --cert=cert.pem --key=key.pem\` → rolling restart

**Recommended MTTR:** ~12 minutes if auth cert is rotated first, P0 rollback follows.`,
  errors: `## Error Rate Analysis — Last 24h

| Service | Error Rate | P99 Latency | Status |
|---------|-----------|-------------|--------|
| payment-service | 4.2% ↑ | 2,400ms | 🔴 Critical |
| auth-service | 12.1% ↑↑ | 180ms | 🟠 High |
| api-gateway | 0.3% → | 45ms | 🟢 Normal |
| user-service | 0.1% → | 38ms | 🟢 Normal |

**Root cause signal:** payment-service error rate increased 340% correlated with v2.2.0 deployment at 14:32 UTC. No smoke tests ran against staging before promote.

**Recommendation:** Rollback to v2.1.3 — last stable release.`,
  logs: `## Error Log Summary — Last 24h

**Top patterns by frequency:**

\`\`\`
47×  Database connection timeout after 5000ms   → payment-service
23×  HTTP 503 from upstream: payment-service    → api-gateway
156× Authentication failed: invalid JWT sig     → auth-service
 8×  Kafka consumer group rebalanced            → orders-consumer
\`\`\`

**Blast radius:** Auth-service JWT errors are the root cause for ~78% of downstream failures. The expired TLS certificate is generating cascade failures across all services that call auth.

**Trace correlation:** All 156 JWT failures share trace prefix \`8dd04e2c423\` — single ingress path.`,
  deployment: `## Deployment Correlation Analysis

**Causal chain identified:**

\`\`\`
14:28 UTC  payment-service v2.2.0 deployed (production)
14:32 UTC  error_rate 0.3% → 4.2%  (+1,300%)
14:33 UTC  P99 latency 180ms → 2,400ms
14:35 UTC  Incident INC-001 auto-created (CRITICAL)
\`\`\`

**High confidence (87%):** payment-service v2.2.0 is the root cause.
- No smoke tests run in staging
- DB migration included connection pool config change (max_connections: 100 → 10)
- No canary release, full traffic immediately

**Remediation:**
\`\`\`bash
kubectl rollout undo deployment/payment-service
# then: patch max_connections back to 100 in ConfigMap
\`\`\``,
};

function getReply(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("incident") || m.includes("open") || m.includes("critical")) return MOCK.incidents;
  if (m.includes("error") || m.includes("rate") || m.includes("high")) return MOCK.errors;
  if (m.includes("log") || m.includes("summar")) return MOCK.logs;
  if (m.includes("deploy") || m.includes("outage") || m.includes("rollback") || m.includes("caused")) return MOCK.deployment;
  return MOCK.default;
}

function renderMarkdown(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#EAECF0">$1</strong>')
    .replace(/`([^`\n]+)`/g, '<code style="font-family:JetBrains Mono,monospace;font-size:11px;background:#06080B;border:1px solid #181D26;border-radius:3px;padding:1px 5px;color:#60A5FA">$1</code>')
    .replace(/```(?:bash)?\n?([\s\S]*?)```/g, '<pre style="font-family:JetBrains Mono,monospace;font-size:11px;background:#06080B;border:1px solid #181D26;border-radius:5px;padding:12px 14px;margin:8px 0;overflow-x:auto;color:#34D399;white-space:pre;line-height:1.6">$1</pre>')
    .replace(/^## (.+)$/gm, '<div style="font-size:13px;font-weight:600;color:#EAECF0;margin:14px 0 6px;letter-spacing:-0.01em">$1</div>')
    .replace(/^\| (.+) \|$/gm, (line) => {
      if (line.includes("---")) return "";
      const cells = line.split("|").filter(Boolean).map(c => c.trim());
      return `<div style="display:flex;gap:0;font-family:JetBrains Mono,monospace;font-size:11px;border-bottom:1px solid #181D26;padding:5px 0">${cells.map((c, i) => `<span style="flex:1;color:${i === 0 ? "#C1CAD6" : "#7A8899"}">${c}</span>`).join("")}</div>`;
    })
    .replace(/^• \*\*(.+?)\*\*(.*)$/gm, '<div style="display:flex;gap:8px;margin:6px 0;padding-left:4px"><span style="color:#3B82F6;margin-top:1px;flex-shrink:0">•</span><div><strong style="color:#EAECF0;font-size:12.5px">$1</strong><span style="color:#7A8899;font-size:12px">$2</span></div></div>')
    .replace(/^• (.+)$/gm, '<div style="display:flex;gap:8px;margin:4px 0;padding-left:4px"><span style="color:#252E3A;flex-shrink:0">•</span><span style="color:#7A8899;font-size:12px">$1</span></div>')
    .replace(/^> (.+)$/gm, '<div style="border-left:2px solid rgba(59,130,246,0.4);padding:8px 12px;margin:10px 0;background:rgba(59,130,246,0.04);border-radius:0 5px 5px 0;color:#7A8899;font-size:12px;font-style:italic">$1</div>')
    .replace(/\n\n/g, '<div style="height:6px"></div>')
    .replace(/\n/g, "<br/>");
}

/* ── Static intelligence panels ── */
const RCA_HYPOTHESES = [
  {
    id: "h1",
    title: "Connection pool exhaustion in payment-service",
    confidence: 87,
    service: "payment-service",
    evidence: ["DB timeout errors ↑ 340%", "v2.2.0 changed max_connections: 100→10", "P99 latency 180ms→2,400ms"],
    action: "kubectl rollout undo deployment/payment-service",
    severity: "critical" as const,
  },
  {
    id: "h2",
    title: "TLS certificate expiry cascading to auth-service",
    confidence: 94,
    service: "auth-service",
    evidence: ["ERR_CERT_EXPIRED in 156 log entries", "12% login failure rate", "Cert expiry timestamp: 03:00 UTC"],
    action: "Rotate TLS certificate, rolling restart",
    severity: "high" as const,
  },
];

const RISK_PREDICTIONS = [
  { service: "orders-consumer", risk: "Kafka consumer lag approaching rebalance threshold (48k/50k)", level: "warn" as const, eta: "~20 min" },
  { service: "recommendation-engine", risk: "Memory usage at 84% — OOM risk under current load trajectory", level: "warn" as const, eta: "~2 hrs" },
  { service: "api-gateway", risk: "Certificate renewal due in 14 days — add to rotation queue", level: "info" as const, eta: "14 days" },
];

const DEP_CORRELATIONS = [
  { version: "v2.2.0", service: "payment-service", env: "production", impact: "P99 latency spike +1,300%", status: "causal" as const, time: "14:28 UTC" },
  { version: "v1.1.1", service: "search-service",  env: "staging",    impact: "CI pipeline failure — 3 tests", status: "isolated" as const, time: "12:14 UTC" },
  { version: "v2.0.0", service: "user-service",    env: "staging",    impact: "Rolled back — schema migration conflict", status: "rolled_back" as const, time: "09:40 UTC" },
];

export default function InsightsPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: MOCK.default, ts: new Date() },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"rca" | "risks" | "deployments">("rca");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const user: Message = { id: crypto.randomUUID(), role: "user", content: text, ts: new Date() };
    setMessages(p => [...p, user]);
    setInput("");
    setLoading(true);
    await new Promise(r => setTimeout(r, 600 + Math.random() * 700));
    const assistant: Message = { id: crypto.randomUUID(), role: "assistant", content: getReply(text), ts: new Date() };
    setMessages(p => [...p, assistant]);
    setLoading(false);
  };

  const CONF_COLOR = (c: number) => c >= 85 ? "#34D399" : c >= 70 ? "#FBBF24" : "#F87171";
  const SEV_COLOR: Record<string, string> = { critical: "#F87171", high: "#FB923C", medium: "#FCD34D" };
  const RISK_COLOR = { warn: "#FBBF24", info: "#60A5FA", critical: "#F87171" };
  const DEP_STATUS_COLOR = { causal: "#F87171", isolated: "#FBBF24", rolled_back: "#F97316" };
  const DEP_STATUS_LABEL = { causal: "Root cause", isolated: "Isolated", rolled_back: "Rolled back" };

  return (
    <div style={{ maxWidth: 1260, margin: "0 auto", display: "flex", flexDirection: "column", gap: 0 }} className="fade-in">

      {/* Page header */}
      <div className="page-header" style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: "linear-gradient(135deg, #1D4ED8 0%, #7C3AED 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 20px rgba(59,130,246,0.2)",
          }}>
            <Brain size={16} color="#fff" />
          </div>
          <div>
            <h1 className="page-title">AI Insights</h1>
            <p className="page-sub">Root cause analysis · Risk predictions · Deployment correlations</p>
          </div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)",
          borderRadius: 99, padding: "5px 12px", fontSize: 11, color: "#A78BFA",
        }}>
          <Sparkles size={11} />
          GPT-4o · demo mode
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 12, alignItems: "start" }}>

        {/* Left: Intelligence panels */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Tab nav */}
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #181D26" }}>
            {([
              { key: "rca",         label: "Root Cause Analysis", icon: Brain,       count: RCA_HYPOTHESES.length },
              { key: "risks",       label: "Risk Predictions",    icon: ShieldAlert,  count: RISK_PREDICTIONS.length },
              { key: "deployments", label: "Deployment Signals",  icon: GitMerge,     count: DEP_CORRELATIONS.length },
            ] as const).map(({ key, label, icon: Icon, count }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "9px 14px", background: "none", border: "none",
                  borderBottom: `2px solid ${tab === key ? "#3B82F6" : "transparent"}`,
                  color: tab === key ? "#EAECF0" : "#404C5C",
                  fontSize: 12.5, fontWeight: tab === key ? 500 : 400,
                  cursor: "pointer", transition: "color 0.12s", fontFamily: "inherit",
                  marginBottom: -1,
                }}
              >
                <Icon size={13} />
                {label}
                <span style={{
                  fontSize: 10, fontWeight: 600,
                  background: tab === key ? "rgba(59,130,246,0.12)" : "#0F1215",
                  color: tab === key ? "#60A5FA" : "#404C5C",
                  border: `1px solid ${tab === key ? "rgba(59,130,246,0.2)" : "#181D26"}`,
                  borderRadius: 99, padding: "0 5px",
                }}>
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* RCA tab */}
          {tab === "rca" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {RCA_HYPOTHESES.map(h => (
                <div key={h.id} className="panel" style={{ overflow: "hidden" }}>
                  {/* Header */}
                  <div style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #181D26",
                    display: "flex", alignItems: "flex-start", gap: 10,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                        <span className={`sev sev-${h.severity}`}>{h.severity}</span>
                        <span style={{ fontSize: 10, color: "#404C5C", fontFamily: "JetBrains Mono, monospace" }}>{h.service}</span>
                      </div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: "#EAECF0", letterSpacing: "-0.015em", lineHeight: 1.3 }}>
                        {h.title}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0, textAlign: "right" }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: CONF_COLOR(h.confidence), letterSpacing: "-0.03em" }}>
                        {h.confidence}%
                      </div>
                      <div style={{ fontSize: 10, color: "#404C5C" }}>confidence</div>
                    </div>
                  </div>
                  {/* Confidence bar */}
                  <div style={{ padding: "0 16px" }}>
                    <div className="conf-bar">
                      <div
                        className="conf-fill"
                        style={{
                          width: `${h.confidence}%`,
                          background: `linear-gradient(90deg, ${CONF_COLOR(h.confidence)}60, ${CONF_COLOR(h.confidence)})`,
                        }}
                      />
                    </div>
                  </div>
                  {/* Evidence */}
                  <div style={{ padding: "12px 16px", borderTop: "1px solid #181D26" }}>
                    <div style={{ fontSize: 10.5, color: "#404C5C", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 7 }}>
                      Evidence
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {h.evidence.map((e, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#C1CAD6" }}>
                          <Activity size={10} style={{ color: "#404C5C", flexShrink: 0 }} />
                          {e}
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Remediation */}
                  <div style={{ padding: "10px 16px", borderTop: "1px solid #181D26", background: "rgba(16,185,129,0.03)" }}>
                    <div style={{ fontSize: 10.5, color: "#34D399", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 6 }}>
                      Recommended Action
                    </div>
                    <div style={{
                      fontFamily: "JetBrains Mono, monospace", fontSize: 11.5,
                      color: "#34D399", background: "#06080B", border: "1px solid rgba(16,185,129,0.15)",
                      borderRadius: 4, padding: "7px 10px",
                    }}>
                      {h.action}
                    </div>
                  </div>
                </div>
              ))}

              {/* Healthy state */}
              <div className="insight-card" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CheckCircle2 size={16} style={{ color: "#10B981", flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 500, color: "#C1CAD6" }}>4 other services nominal</div>
                  <div style={{ fontSize: 11.5, color: "#404C5C" }}>No anomalies detected in user-service, notification-service, search-service, orders-consumer</div>
                </div>
              </div>
            </div>
          )}

          {/* Risk Predictions tab */}
          {tab === "risks" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {RISK_PREDICTIONS.map((r, i) => (
                <div key={i} className="insight-card">
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <ShieldAlert size={14} style={{ color: RISK_COLOR[r.level], marginTop: 1, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11.5, color: "#C1CAD6", fontWeight: 500 }}>
                          {r.service}
                        </span>
                        <span style={{ fontSize: 10, color: RISK_COLOR[r.level], fontWeight: 600,
                          background: `${RISK_COLOR[r.level]}12`, border: `1px solid ${RISK_COLOR[r.level]}25`,
                          borderRadius: 3, padding: "1px 5px", textTransform: "uppercase", letterSpacing: "0.03em",
                        }}>
                          {r.level}
                        </span>
                      </div>
                      <div style={{ fontSize: 12.5, color: "#7A8899", lineHeight: 1.5, marginBottom: 6 }}>{r.risk}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#404C5C" }}>
                        <Clock size={10} />
                        ETA: {r.eta}
                      </div>
                    </div>
                    <ArrowRight size={13} style={{ color: "#252E3A", flexShrink: 0, marginTop: 2 }} />
                  </div>
                </div>
              ))}
              <div className="insight-card" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CheckCircle2 size={14} style={{ color: "#10B981", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#7A8899" }}>
                  No additional risk signals detected across remaining 5 services.
                </span>
              </div>
            </div>
          )}

          {/* Deployment Signals tab */}
          {tab === "deployments" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {DEP_CORRELATIONS.map((d, i) => (
                <div key={i} className="insight-card">
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <GitMerge size={14} style={{ color: "#7A8899", marginTop: 2, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#EAECF0", fontWeight: 600 }}>
                          {d.version}
                        </span>
                        <span className={`env env-${d.env}`}>{d.env}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 600, color: DEP_STATUS_COLOR[d.status],
                          background: `${DEP_STATUS_COLOR[d.status]}12`,
                          border: `1px solid ${DEP_STATUS_COLOR[d.status]}25`,
                          borderRadius: 3, padding: "1px 5px", letterSpacing: "0.03em",
                          textTransform: "uppercase",
                        }}>
                          {DEP_STATUS_LABEL[d.status]}
                        </span>
                      </div>
                      <div style={{ fontSize: 11.5, color: "#404C5C", fontFamily: "JetBrains Mono, monospace", marginBottom: 4 }}>
                        {d.service}
                      </div>
                      <div style={{ fontSize: 12.5, color: "#C1CAD6" }}>{d.impact}</div>
                    </div>
                    <span style={{ fontSize: 10.5, color: "#404C5C", flexShrink: 0, fontFamily: "JetBrains Mono, monospace" }}>
                      {d.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: AI Chat */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div className="panel" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 140px)", minHeight: 500 }}>

            {/* Chat header */}
            <div style={{ padding: "12px 14px", borderBottom: "1px solid #181D26", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 6,
                  background: "linear-gradient(135deg, #1D4ED8, #7C3AED)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Bot size={12} color="#fff" />
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "#EAECF0" }}>Ask AI</span>
                <span style={{ fontSize: 10, color: "#404C5C", marginLeft: "auto" }}>demo mode</span>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {messages.map(msg => (
                  <div key={msg.id} style={{
                    display: "flex", gap: 8,
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  }}>
                    {msg.role === "assistant" && (
                      <div style={{
                        width: 24, height: 24, borderRadius: 7, flexShrink: 0, marginTop: 2,
                        background: "linear-gradient(135deg, #1D4ED8, #7C3AED)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Bot size={12} color="#fff" />
                      </div>
                    )}
                    <div style={{
                      maxWidth: "88%",
                      background: msg.role === "user"
                        ? "linear-gradient(135deg, #1D4ED8, #2563EB)"
                        : "#0F1215",
                      border: msg.role === "user"
                        ? "1px solid rgba(59,130,246,0.4)"
                        : "1px solid #181D26",
                      borderRadius: msg.role === "user"
                        ? "10px 10px 2px 10px"
                        : "2px 10px 10px 10px",
                      padding: "9px 12px",
                      fontSize: 12.5,
                      color: msg.role === "user" ? "#fff" : "#C1CAD6",
                      lineHeight: 1.6,
                    }}>
                      {msg.role === "assistant" ? (
                        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                      ) : msg.content}
                      <div style={{ fontSize: 9.5, marginTop: 5, opacity: 0.4 }}>
                        {msg.ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    {msg.role === "user" && (
                      <div style={{
                        width: 24, height: 24, borderRadius: 7, flexShrink: 0, marginTop: 2,
                        background: "#181D26", border: "1px solid #222A38",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <User size={12} color="#404C5C" />
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                      background: "linear-gradient(135deg, #1D4ED8, #7C3AED)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Bot size={12} color="#fff" />
                    </div>
                    <div style={{
                      background: "#0F1215", border: "1px solid #181D26",
                      borderRadius: "2px 10px 10px 10px", padding: "11px 14px",
                      display: "flex", alignItems: "center", gap: 4,
                    }}>
                      {[0, 150, 300].map(delay => (
                        <div key={delay} style={{
                          width: 5, height: 5, borderRadius: "50%", background: "#3B82F6",
                          animation: "bounce 1.2s infinite",
                          animationDelay: `${delay}ms`,
                        }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </div>

            {/* Suggestions */}
            {messages.length <= 1 && (
              <div style={{ padding: "10px 12px", borderTop: "1px solid #181D26", flexShrink: 0 }}>
                <div style={{ fontSize: 10, color: "#252E3A", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>
                  Suggested
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {SUGGESTIONS.map(s => (
                    <button key={s.label} onClick={() => send(s.label)} style={{
                      display: "flex", alignItems: "center", gap: 7,
                      background: "#0B0D10", border: "1px solid #181D26", borderRadius: 5,
                      padding: "7px 10px", cursor: "pointer", textAlign: "left", transition: "all 0.12s",
                      width: "100%", fontFamily: "inherit",
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#0F1215"; (e.currentTarget as HTMLElement).style.borderColor = "#222A38"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#0B0D10"; (e.currentTarget as HTMLElement).style.borderColor = "#181D26"; }}
                    >
                      <s.icon size={12} style={{ color: s.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11.5, color: "#7A8899" }}>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div style={{ borderTop: "1px solid #181D26", padding: "10px 12px", flexShrink: 0 }}>
              <form onSubmit={e => { e.preventDefault(); send(input); }} style={{ display: "flex", gap: 6 }}>
                <input
                  value={input} onChange={e => setInput(e.target.value)}
                  placeholder="Ask about incidents, logs, metrics…"
                  className="field field-md"
                  style={{ flex: 1, fontSize: 12 }}
                />
                <button
                  type="submit" disabled={!input.trim() || loading}
                  style={{
                    width: 34, height: 32, borderRadius: 5,
                    background: input.trim() ? "#2563EB" : "#0F1215",
                    border: `1px solid ${input.trim() ? "#3B82F6" : "#181D26"}`,
                    cursor: input.trim() ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s", flexShrink: 0,
                  }}
                >
                  <Send size={13} color={input.trim() ? "#fff" : "#404C5C"} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
