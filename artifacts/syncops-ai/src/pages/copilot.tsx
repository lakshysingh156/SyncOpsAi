import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Zap, AlertTriangle, BarChart3, ScrollText, Rocket, Brain } from "lucide-react";

interface Message {
  id: string; role: "user" | "assistant"; content: string; ts: Date;
}

const SUGGESTIONS = [
  { icon: AlertTriangle, label: "What are the current open incidents?",     color: "#EF4444" },
  { icon: BarChart3,     label: "Show me services with high error rates",   color: "#F59E0B" },
  { icon: ScrollText,    label: "Summarize recent error logs",              color: "#60A5FA" },
  { icon: Rocket,        label: "Which deployment last caused an outage?",  color: "#8B5CF6" },
];

const MOCK: Record<string, string> = {
  default: `I'm SyncOps AI Copilot — your operational intelligence assistant.

**What I can help with:**
• **Root Cause Analysis** — correlate logs, metrics, and incidents to identify blast radius
• **Deployment Risk Assessment** — detect regressions from recent deploys
• **Log Summarization** — surface error patterns across services
• **Incident Triage** — recommend severity, ownership, and remediation steps
• **Anomaly Detection** — flag metric deviations and correlate with timeline events

> The RAG pipeline (Phase 4) will connect me to your live telemetry. Currently running in demo mode — responses simulate production AI behavior.`,
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
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#E8ECF4">$1</strong>')
    .replace(/`([^`\n]+)`/g, '<code style="font-family:JetBrains Mono,monospace;font-size:11px;background:#0C0E12;border:1px solid #1C2029;border-radius:3px;padding:1px 5px;color:#60A5FA">$1</code>')
    .replace(/```(?:bash)?\n?([\s\S]*?)```/g, '<pre style="font-family:JetBrains Mono,monospace;font-size:11px;background:#07090C;border:1px solid #1C2029;border-radius:4px;padding:10px 12px;margin:8px 0;overflow-x:auto;color:#34D399;white-space:pre">$1</pre>')
    .replace(/^## (.+)$/gm, '<div style="font-size:13px;font-weight:600;color:#E8ECF4;margin:12px 0 6px">$1</div>')
    .replace(/^\| (.+) \|$/gm, (line) => {
      if (line.includes("---")) return "";
      const cells = line.split("|").filter(Boolean).map(c => c.trim());
      return `<div style="display:flex;gap:0;font-family:JetBrains Mono,monospace;font-size:11px;border-bottom:1px solid #1C2029;padding:4px 0">${cells.map(c => `<span style="flex:1;color:#8896AB">${c}</span>`).join("")}</div>`;
    })
    .replace(/^• \*\*(.+?)\*\*(.*)$/gm, '<div style="display:flex;gap:8px;margin:6px 0"><span style="color:#3B82F6;margin-top:1px">•</span><div><strong style="color:#E8ECF4">$1</strong><span style="color:#8896AB">$2</span></div></div>')
    .replace(/^• (.+)$/gm, '<div style="display:flex;gap:8px;margin:4px 0"><span style="color:#4E5A6B;margin-top:1px">•</span><span style="color:#8896AB">$1</span></div>')
    .replace(/^> (.+)$/gm, '<div style="border-left:2px solid #3B82F6;padding:8px 12px;margin:10px 0;background:rgba(59,130,246,0.05);border-radius:0 4px 4px 0;font-style:italic;color:#8896AB;font-size:12px">$1</div>')
    .replace(/\n\n/g, '<div style="height:8px"></div>')
    .replace(/\n/g, "<br/>");
}

export default function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: MOCK.default, ts: new Date() },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
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
    await new Promise(r => setTimeout(r, 700 + Math.random() * 800));
    const assistant: Message = { id: crypto.randomUUID(), role: "assistant", content: getReply(text), ts: new Date() };
    setMessages(p => [...p, assistant]);
    setLoading(false);
  };

  const chatH = "calc(100vh - 180px)";

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", height: chatH, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 20px rgba(59,130,246,0.25)",
          }}>
            <Brain size={18} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 600, color: "#E8ECF4", letterSpacing: "-0.02em" }}>AI Copilot</h1>
            <p style={{ fontSize: 11, color: "#4E5A6B", marginTop: 1 }}>Operational intelligence — Phase 4 RAG pipeline</p>
          </div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)",
          borderRadius: 99, padding: "4px 12px",
          fontSize: 11, color: "#60A5FA",
        }}>
          <Sparkles size={11} />
          GPT-4o · demo mode
        </div>
      </div>

      {/* Chat panel */}
      <div className="panel" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display: "flex", gap: 10, justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                {msg.role === "assistant" && (
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginTop: 2,
                    background: "linear-gradient(135deg, #2563EB, #7C3AED)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Bot size={14} color="#fff" />
                  </div>
                )}
                <div style={{
                  maxWidth: "82%",
                  background: msg.role === "user" ? "linear-gradient(135deg, #2563EB, #1D4ED8)" : "#111318",
                  border: msg.role === "user" ? "1px solid #3B82F6" : "1px solid #1C2029",
                  borderRadius: msg.role === "user" ? "10px 10px 2px 10px" : "2px 10px 10px 10px",
                  padding: "10px 14px",
                  fontSize: 13,
                  color: msg.role === "user" ? "#fff" : "#C4CDD9",
                  lineHeight: 1.6,
                }}>
                  {msg.role === "assistant" ? (
                    <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                  ) : msg.content}
                  <div style={{ fontSize: 10, marginTop: 6, opacity: 0.45 }}>
                    {msg.ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                {msg.role === "user" && (
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginTop: 2,
                    background: "#1C2029", border: "1px solid #252D3A",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <User size={14} color="#4E5A6B" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: "linear-gradient(135deg, #2563EB, #7C3AED)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Bot size={14} color="#fff" />
                </div>
                <div style={{
                  background: "#111318", border: "1px solid #1C2029",
                  borderRadius: "2px 10px 10px 10px", padding: "12px 16px",
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  {[0, 150, 300].map(delay => (
                    <div key={delay} style={{
                      width: 6, height: 6, borderRadius: "50%", background: "#3B82F6",
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
          <div style={{ padding: "12px 16px", borderTop: "1px solid #1C2029" }}>
            <div style={{ fontSize: 10, color: "#2E3848", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>Suggested</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {SUGGESTIONS.map(s => (
                <button key={s.label} onClick={() => send(s.label)} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "#0C0E12", border: "1px solid #1C2029", borderRadius: 5,
                  padding: "8px 12px", cursor: "pointer", textAlign: "left", transition: "all 0.12s",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#111318"; (e.currentTarget as HTMLElement).style.borderColor = "#252D3A"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#0C0E12"; (e.currentTarget as HTMLElement).style.borderColor = "#1C2029"; }}
                >
                  <s.icon size={13} style={{ color: s.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#8896AB" }}>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div style={{ borderTop: "1px solid #1C2029", padding: "12px 14px" }}>
          <form onSubmit={e => { e.preventDefault(); send(input); }} style={{ display: "flex", gap: 8 }}>
            <input
              value={input} onChange={e => setInput(e.target.value)}
              placeholder="Ask about incidents, logs, metrics, deployments…"
              className="field field-md"
              style={{ flex: 1 }}
            />
            <button
              type="submit" disabled={!input.trim() || loading}
              style={{
                width: 36, height: 32, borderRadius: 6,
                background: input.trim() ? "#2563EB" : "#111318",
                border: "1px solid",
                borderColor: input.trim() ? "#3B82F6" : "#1C2029",
                cursor: input.trim() ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}
            >
              <Send size={14} color={input.trim() ? "#fff" : "#4E5A6B"} />
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
