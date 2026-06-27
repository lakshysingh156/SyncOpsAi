import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, CheckCircle2, XCircle, Clock, RotateCcw, Loader2, Zap } from "lucide-react";

interface Deployment {
  id: string; service_id: string | null; service_name: string | null;
  version: string; status: string; environment: string;
  deployed_by: string | null; notes: string | null;
  started_at: string; finished_at: string | null; created_at: string;
}

const STATUS_CFG: Record<string, { color: string; icon: React.ElementType; dot: string }> = {
  success:     { color: "#10B981", icon: CheckCircle2, dot: "#10B981" },
  failed:      { color: "#EF4444", icon: XCircle,     dot: "#EF4444" },
  pending:     { color: "#4E5A6B", icon: Clock,        dot: "#252D3A" },
  running:     { color: "#60A5FA", icon: Loader2,      dot: "#3B82F6" },
  rolled_back: { color: "#F59E0B", icon: RotateCcw,    dot: "#F59E0B" },
};

function duration(start: string, end: string | null) {
  if (!end) return "in progress";
  const s = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}
function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function CreateModal({ onClose, services }: { onClose: () => void; services: any[] }) {
  const [version, setVersion] = useState(""); const [env, setEnv] = useState("production");
  const [svcId, setSvcId] = useState(""); const [deployedBy, setDeployedBy] = useState("lakshay.singh");
  const [notes, setNotes] = useState("");
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: (body: any) => fetch("/api/deployments", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
    }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["deployments"] }); onClose(); },
  });
  const fieldStyle: React.CSSProperties = { width: "100%", padding: "7px 10px", height: "auto" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="panel" style={{ width: 460 }}>
        <div className="panel-header">
          <span style={{ fontSize: 13, fontWeight: 600, color: "#E8ECF4" }}>New Deployment</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#4E5A6B" }}><X size={16} /></button>
        </div>
        <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: "#4E5A6B", fontWeight: 600, letterSpacing: "0.04em", display: "block", marginBottom: 5 }}>VERSION *</label>
              <input value={version} onChange={e => setVersion(e.target.value)} className="field field-md mono" style={fieldStyle} placeholder="v2.3.1" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#4E5A6B", fontWeight: 600, letterSpacing: "0.04em", display: "block", marginBottom: 5 }}>ENVIRONMENT *</label>
              <select value={env} onChange={e => setEnv(e.target.value)} className="field field-md" style={{ ...fieldStyle, cursor: "pointer" }}>
                <option value="production">production</option>
                <option value="staging">staging</option>
                <option value="development">development</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#4E5A6B", fontWeight: 600, letterSpacing: "0.04em", display: "block", marginBottom: 5 }}>SERVICE</label>
            <select value={svcId} onChange={e => setSvcId(e.target.value)} className="field field-md" style={{ ...fieldStyle, cursor: "pointer" }}>
              <option value="">— platform-wide —</option>
              {services.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#4E5A6B", fontWeight: 600, letterSpacing: "0.04em", display: "block", marginBottom: 5 }}>DEPLOYED BY</label>
            <input value={deployedBy} onChange={e => setDeployedBy(e.target.value)} className="field field-md" style={fieldStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#4E5A6B", fontWeight: 600, letterSpacing: "0.04em", display: "block", marginBottom: 5 }}>NOTES</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="field" style={{ ...fieldStyle, resize: "none", padding: 10 }} placeholder="Changelog, rollout notes…" />
          </div>
        </div>
        <div style={{ padding: "12px 18px", borderTop: "1px solid #1C2029", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-sm btn-blue" disabled={!version || create.isPending}
            onClick={() => create.mutate({ version, environment: env, service_id: svcId || null, deployed_by: deployedBy || null, notes: notes || null })}>
            {create.isPending ? "Deploying…" : "Deploy"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DeploymentsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();

  const { data: deployments = [], isLoading } = useQuery<Deployment[]>({
    queryKey: ["deployments"],
    queryFn: () => fetch("/api/deployments").then(r => r.json()),
    refetchInterval: 30_000,
  });
  const { data: services = [] } = useQuery<any[]>({
    queryKey: ["services"],
    queryFn: () => fetch("/api/services").then(r => r.json()),
  });

  const genDemo = useMutation({
    mutationFn: () => fetch("/api/deployments/generate-demo-data", { method: "POST" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deployments"] }),
  });

  const total = deployments.length;
  const success = deployments.filter(d => d.status === "success").length;
  const failed  = deployments.filter(d => d.status === "failed").length;
  const running = deployments.filter(d => d.status === "running").length;
  const rate = total ? `${Math.round((success / total) * 100)}%` : "—";

  const stripStats = [
    { label: "SUCCESS RATE", value: rate, color: "#10B981" },
    { label: "TOTAL", value: total, color: "#E8ECF4" },
    { label: "SUCCESSFUL", value: success, color: "#10B981" },
    { label: "FAILED", value: failed, color: "#EF4444" },
    { label: "RUNNING", value: running, color: "#60A5FA" },
  ];

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} services={services as any[]} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: "#E8ECF4", letterSpacing: "-0.02em" }}>Deployments</h1>
          <p style={{ fontSize: 12, color: "#4E5A6B", marginTop: 2 }}>Deployment audit trail — version, environment, status & rollback history</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {deployments.length === 0 && (
            <button className="btn btn-sm btn-outline-blue" onClick={() => genDemo.mutate()} disabled={genDemo.isPending}>
              <Zap size={12} />{genDemo.isPending ? "…" : "Generate Demo Data"}
            </button>
          )}
          <button className="btn btn-sm btn-blue" onClick={() => setShowCreate(true)}>
            <Plus size={12} />New Deployment
          </button>
        </div>
      </div>

      {/* Stat strip */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {stripStats.map(s => (
          <div key={s.label} className="panel" style={{ flex: 1, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, color: "#4E5A6B", fontWeight: 600, letterSpacing: "0.07em", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, letterSpacing: "-0.03em" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="panel" style={{ overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#4E5A6B", fontSize: 12 }}>Loading…</div>
        ) : deployments.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "#4E5A6B" }}>No deployments yet.</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 110 }}>Status</th>
                  <th style={{ width: 120 }}>Version</th>
                  <th>Service</th>
                  <th style={{ width: 120 }}>Environment</th>
                  <th style={{ width: 140 }}>Deployed By</th>
                  <th style={{ width: 90 }}>Duration</th>
                  <th style={{ width: 80 }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {deployments.map(dep => {
                  const cfg = STATUS_CFG[dep.status] ?? STATUS_CFG.pending;
                  const Icon = cfg.icon;
                  return (
                    <tr key={dep.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Icon size={13} style={{ color: cfg.color, animation: dep.status === "running" ? "spin 1s linear infinite" : "none", flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: cfg.color, fontWeight: 500 }}>{dep.status}</span>
                        </div>
                      </td>
                      <td><span className="mono" style={{ fontSize: 12.5, fontWeight: 500, color: "#E8ECF4" }}>{dep.version}</span></td>
                      <td style={{ color: "#8896AB" }}>{dep.service_name ?? "—"}</td>
                      <td><span className={`env env-${dep.environment}`}>{dep.environment}</span></td>
                      <td><span className="mono" style={{ fontSize: 11.5, color: "#8896AB" }}>{dep.deployed_by ?? "—"}</span></td>
                      <td><span className="mono" style={{ fontSize: 11.5, color: "#4E5A6B" }}>{duration(dep.started_at, dep.finished_at)}</span></td>
                      <td><span className="mono" style={{ fontSize: 11, color: "#4E5A6B" }}>{timeAgo(dep.created_at)}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
