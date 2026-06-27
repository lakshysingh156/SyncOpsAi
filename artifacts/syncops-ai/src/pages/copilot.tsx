import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Zap, AlertTriangle, BarChart3, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: Date;
}

const SUGGESTIONS = [
  { icon: AlertTriangle, label: "What are the current open incidents?", color: "text-danger" },
  { icon: BarChart3, label: "Show me services with high error rates", color: "text-warn" },
  { icon: ScrollText, label: "Summarize recent error logs", color: "text-info" },
  { icon: Zap, label: "Which deployment last caused an outage?", color: "text-accent" },
];

const MOCK_RESPONSES: Record<string, string> = {
  default: `I'm SyncOps AI Copilot — your operational intelligence assistant.

I can help you with:
• **Root Cause Analysis** — correlate logs, metrics, and incidents to find the blast radius
• **Deployment Risk** — assess whether a recent deploy triggered a regression  
• **Log Summarization** — parse error patterns across services
• **Incident Triage** — understand severity and next steps

> **Note:** The RAG pipeline (Phase 4) will connect me to live telemetry. For now, I'm demonstrating the interface. Ask me anything about your platform.`,
  incidents: `## Open Incidents Summary

Based on your incident data, here's the current operational posture:

**Critical (P0)**
- Payment service P99 latency spike at 2.4s — checkout conversion dropping
- Root cause hypothesis: database connection pool exhaustion under load

**High (P1)**  
- Auth service JWT validation failures — certificate expired at 03:00 UTC
- Immediate action: rotate certificate, no data breach detected

**Recommendations:**
1. Page on-call for payment-service team immediately
2. Auth fix is straightforward — use: \`kubectl rollout restart deploy/auth-service\`
3. Set up PagerDuty alert for cert expiry >7 days`,
  errors: `## Error Rate Analysis

Scanning metrics from the last 24 hours:

| Service | Error Rate | P99 Latency | Trend |
|---------|-----------|-------------|-------|
| payment-svc | 4.2% ↑ | 2,400ms | 🔴 Critical |
| auth-service | 12.1% ↑↑ | 180ms | 🟠 High |
| api-gateway | 0.3% → | 45ms | 🟢 Normal |

**Anomaly detected:** payment-svc error rate increased 340% in the past 2 hours, correlated with the v2.2.0 deployment at 14:32 UTC.

**Suggested fix:** Roll back to v2.1.3 — the last stable version.`,
  logs: `## Recent Error Log Summary (24h)

**Top error patterns:**

1. \`Database connection timeout after 5000ms\` — 47 occurrences, payment-service
2. \`HTTP 503 from upstream service: payment-service\` — 23 occurrences, api-gateway  
3. \`Kafka consumer group rebalanced\` — 8 occurrences, orders-consumer
4. \`Authentication failed: invalid JWT signature\` — 156 occurrences, auth-service

**Blast radius:** The auth-service JWT errors are the root cause for 78% of downstream failures. The expired certificate is generating cascade failures across all services that call auth.`,
  deployment: `## Deployment Correlation Analysis

**Most recent deployments (last 24h):**

| Version | Service | Status | Time |
|---------|---------|--------|------|
| v2.2.0 | payment-svc | ❌ Failed | 2h ago |
| v1.8.1 | auth-service | ✅ Success | 6h ago |
| v3.1.0 | api-gateway | ✅ Success | 12h ago |

**High confidence:** payment-svc v2.2.0 is the likely root cause of the current P0 incident. The deploy preceded the latency spike by 4 minutes. No smoke tests were run against the staging environment.

**Recommended action:**
\`\`\`bash
kubectl rollout undo deployment/payment-service
\`\`\``,
};

function getResponse(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes("incident") || msg.includes("open") || msg.includes("alert")) return MOCK_RESPONSES.incidents;
  if (msg.includes("error") || msg.includes("rate") || msg.includes("high")) return MOCK_RESPONSES.errors;
  if (msg.includes("log") || msg.includes("summar")) return MOCK_RESPONSES.logs;
  if (msg.includes("deploy") || msg.includes("outage") || msg.includes("rollback")) return MOCK_RESPONSES.deployment;
  return MOCK_RESPONSES.default;
}

function formatMarkdown(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code class="rounded bg-surface-3 px-1 py-0.5 font-mono text-xs text-accent">$1</code>')
    .replace(/```bash\n([\s\S]*?)```/g, '<pre class="mt-2 rounded bg-canvas p-3 font-mono text-xs overflow-x-auto text-ok">$1</pre>')
    .replace(/^## (.+)$/gm, '<h3 class="font-semibold text-foreground mt-3 mb-1">$1</h3>')
    .replace(/^• (.+)$/gm, '<li class="ml-4 list-disc text-muted/90">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-muted/90">$1</li>')
    .replace(/^\*\*(.+)\*\*$/gm, '<p class="font-semibold mt-2">$1</p>')
    .replace(/^> (.+)$/gm, '<div class="border-l-2 border-accent/40 pl-3 text-muted/80 italic text-xs mt-2">$1</div>')
    .replace(/\n/g, '<br />');
}

export default function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: MOCK_RESPONSES.default,
      ts: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text, ts: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
    const reply: Message = { id: crypto.randomUUID(), role: "assistant", content: getResponse(text), ts: new Date() };
    setMessages(prev => [...prev, reply]);
    setLoading(false);
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col" style={{ height: "calc(100vh - 8rem)" }}>
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/20 border border-accent/30">
          <Bot className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">AI Copilot</h1>
          <p className="text-xs text-muted">Operational intelligence — Phase 4 (RAG pipeline coming soon)</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs text-accent">
          <Sparkles className="h-3 w-3" />
          GPT-4o · demo mode
        </div>
      </div>

      {/* Chat area */}
      <div className="card flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
              {msg.role === "assistant" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/20 border border-accent/30 mt-0.5">
                  <Bot className="h-3.5 w-3.5 text-accent" />
                </div>
              )}
              <div className={cn(
                "max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-accent text-white rounded-tr-sm"
                  : "bg-surface-2 border border-border text-foreground rounded-tl-sm",
              )}>
                {msg.role === "assistant" ? (
                  <div dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }} className="prose-syncops" />
                ) : (
                  msg.content
                )}
                <p className="mt-2 text-[10px] opacity-50">
                  {msg.ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              {msg.role === "user" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-3 border border-border mt-0.5">
                  <User className="h-3.5 w-3.5 text-muted" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/20 border border-accent/30">
                <Bot className="h-3.5 w-3.5 text-accent" />
              </div>
              <div className="bg-surface-2 border border-border rounded-xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center h-4">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="border-t border-border px-4 py-3">
            <p className="mb-2 text-[11px] text-muted uppercase tracking-wider">Suggested</p>
            <div className="grid grid-cols-2 gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => send(s.label)}
                  className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs text-muted hover:bg-surface-3 hover:text-foreground transition-colors text-left"
                >
                  <s.icon className={cn("h-3.5 w-3.5 shrink-0", s.color)} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border p-3">
          <form
            onSubmit={e => { e.preventDefault(); send(input); }}
            className="flex items-center gap-2"
          >
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about incidents, logs, metrics, deployments…"
              className="flex-1 h-9 rounded-lg border border-border bg-surface-2 px-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent/60"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
