import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, CheckCircle, X } from "lucide-react";

interface Incident {
  id: string; title: string; description: string | null;
  status: string; severity: string;
  service_id: string | null; service_name: string | null;
  assigned_to: string | null; created_at: string;
  updated_at: string; resolved_at: string | null;
}

function timeSince(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function CreateModal({ onClose, services }: { onClose: () => void; services: any[] }) {
  const [title, setTitle] = useState(""); const [desc, setDesc] = useState("");
  const [sev, setSev] = useState("medium"); const [svcId, setSvcId] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (body: any) => fetch("/api/incidents", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
    }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["incidents"] }); onClose(); },
  });

  const fieldStyle: React.CSSProperties = { width: "100%", padding: "7px 10px", height: "auto" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="panel" style={{ width: 460, maxWidth: "calc(100vw - 32px)" }}>
        <div className="panel-header">
          <span style={{ fontSize: 13, fontWeight: 600, color: "#E8ECF4" }}>Declare Incident</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#4E5A6B" }}><X size={16} /></button>
        </div>
        <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: "#4E5A6B", fontWeight: 600, letterSpacing: "0.04em", display: "block", marginBottom: 5 }}>TITLE *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="field field-md" style={fieldStyle} placeholder="e.g. Payment service degraded" />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#4E5A6B", fontWeight: 600, letterSpacing: "0.04em", display: "block", marginBottom: 5 }}>DESCRIPTION</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} className="field" style={{ ...fieldStyle, resize: "none", padding: 10 }} placeholder="What's happening?" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: "#4E5A6B", fontWeight: 600, letterSpacing: "0.04em", display: "block", marginBottom: 5 }}>SEVERITY *</label>
              <select value={sev} onChange={e => setSev(e.target.value)} className="field field-md" style={{ ...fieldStyle, cursor: "pointer" }}>
                {["critical", "high", "medium", "low"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#4E5A6B", fontWeight: 600, letterSpacing: "0.04em", display: "block", marginBottom: 5 }}>SERVICE</label>
              <select value={svcId} onChange={e => setSvcId(e.target.value)} className="field field-md" style={{ ...fieldStyle, cursor: "pointer" }}>
                <option value="">— none —</option>
                {services.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#4E5A6B", fontWeight: 600, letterSpacing: "0.04em", display: "block", marginBottom: 5 }}>ASSIGNED TO</label>
            <input value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="field field-md" style={fieldStyle} placeholder="lakshay.singh" />
          </div>
        </div>
        <div style={{ padding: "12px 18px", borderTop: "1px solid #1C2029", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-sm btn-danger" disabled={!title || create.isPending}
            onClick={() => create.mutate({ title, description: desc || null, severity: sev, service_id: svcId || null, assigned_to: assignedTo || null })}>
            {create.isPending ? "Declaring…" : "Declare Incident"}
          </button>
        </div>
      </div>
    </div>
  );
}

const DEMO_INCS = [
  { title: "Payment service P99 latency spike — 2.4s", severity: "critical", description: "P99 crossed 2.4s. Checkout conversion dropping 23%." },
  { title: "Auth service JWT validation errors (ERR_CERT_EXPIRED)", severity: "high", description: "Certificate expired 03:00 UTC. 12% of logins failing." },
  { title: "Kafka consumer lag exceeding 50k messages on orders topic", severity: "high", description: "Consumer group rebalance loop. Throughput down 80%." },
  { title: "Memory leak detected in recommendation-engine pod", severity: "medium", description: "15MB/min growth. OOMKill expected in ~2h." },
  { title: "CDN cache miss rate elevated to 47% (baseline: 8%)", severity: "medium", description: "Edge cache invalidation loop from bad deploy config." },
  { title: "Slow queries on users table — missing index on email", severity: "low", description: "P95: 850ms. Full table scan on 2.3M rows." },
];

export default function IncidentsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const qc = useQueryClient();

  const { data: incidents = [], isLoading } = useQuery<Incident[]>({
    queryKey: ["incidents", statusFilter],
    queryFn: () => fetch(`/api/incidents${statusFilter ? `?status=${statusFilter}` : ""}`).then(r => r.json()),
    refetchInterval: 30_000,
  });
  const { data: services = [] } = useQuery<any[]>({
    queryKey: ["services"],
    queryFn: () => fetch("/api/services").then(r => r.json()),
  });

  const updateInc = useMutation({
    mutationFn: ({ id, ...body }: any) => fetch(`/api/incidents/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
    }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incidents"] }),
  });

  const seed = async () => {
    setSeeding(true);
    try {
      await Promise.all(DEMO_INCS.map((d, i) => fetch("/api/incidents", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...d, service_id: (services as any[])[i % Math.max(services.length, 1)]?.id ?? null }),
      })));
      qc.invalidateQueries({ queryKey: ["incidents"] });
    } finally { setSeeding(false); }
  };

  const TABS = [
    { value: "", label: "All", count: incidents.length },
    { value: "open", label: "Open", count: incidents.filter(i => i.status === "open").length },
    { value: "investigating", label: "Investigating", count: incidents.filter(i => i.status === "investigating").length },
    { value: "resolved", label: "Resolved", count: incidents.filter(i => i.status === "resolved").length },
  ];

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} services={services as any[]} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: "#E8ECF4", letterSpacing: "-0.02em" }}>Incidents</h1>
          <p style={{ fontSize: 12, color: "#4E5A6B", marginTop: 2 }}>
            Incident lifecycle management & root-cause analysis
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {incidents.length === 0 && (
            <button className="btn btn-sm btn-outline-blue" onClick={seed} disabled={seeding}>
              {seeding ? "Seeding…" : "Seed Demo Incidents"}
            </button>
          )}
          <button className="btn btn-sm btn-danger" onClick={() => setShowCreate(true)}>
            <Plus size={12} /> Declare Incident
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #1C2029", marginBottom: 14 }}>
        {TABS.map(tab => (
          <button key={tab.value} onClick={() => setStatusFilter(tab.value)}
            className={`tab${statusFilter === tab.value ? " tab-active" : ""}`}
            style={{ border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                background: statusFilter === tab.value ? "rgba(59,130,246,0.15)" : "#111318",
                color: statusFilter === tab.value ? "#60A5FA" : "#4E5A6B",
                borderRadius: 99, padding: "0 6px", fontSize: 10.5, fontWeight: 600,
              }}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      <div className="panel" style={{ overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "#4E5A6B", fontSize: 12 }}>Loading…</div>
        ) : incidents.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <CheckCircle size={24} style={{ color: "#10B981", margin: "0 auto 10px" }} />
            <div style={{ fontSize: 13, color: "#10B981", fontWeight: 500 }}>No incidents</div>
            <div style={{ fontSize: 11, color: "#4E5A6B", marginTop: 3 }}>All systems operational.</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 90 }}>Severity</th>
                  <th>Title</th>
                  <th style={{ width: 130 }}>Service</th>
                  <th style={{ width: 120 }}>Assigned</th>
                  <th style={{ width: 90 }}>Opened</th>
                  <th style={{ width: 110 }}>Status</th>
                  <th style={{ width: 130 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map(inc => (
                  <tr key={inc.id}>
                    <td><span className={`sev sev-${inc.severity}`}>{inc.severity}</span></td>
                    <td style={{ maxWidth: 320 }}>
                      <div style={{ fontWeight: 500, color: "#E8ECF4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inc.title}</div>
                      {inc.description && <div style={{ fontSize: 11, color: "#4E5A6B", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inc.description}</div>}
                    </td>
                    <td style={{ color: "#8896AB", fontSize: 12 }}>{inc.service_name ?? "—"}</td>
                    <td style={{ color: "#8896AB", fontSize: 12 }}>{inc.assigned_to ?? "—"}</td>
                    <td><span className="mono" style={{ fontSize: 11, color: "#4E5A6B" }}>{timeSince(inc.created_at)}</span></td>
                    <td><span className={`status status-${inc.status}`}><span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />{inc.status}</span></td>
                    <td>
                      <select
                        value={inc.status}
                        onChange={e => updateInc.mutate({ id: inc.id, status: e.target.value })}
                        className="field field-sm"
                        style={{ width: 120, cursor: "pointer" }}
                      >
                        <option value="open">Open</option>
                        <option value="investigating">Investigating</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
