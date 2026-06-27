import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, CheckCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Incident {
  id: string;
  title: string;
  description: string | null;
  status: string;
  severity: string;
  service_id: string | null;
  service_name: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

const SEV_COLOR: Record<string, string> = {
  critical: "bg-danger/15 text-danger border-danger/30",
  high: "bg-warn/15 text-warn border-warn/30",
  medium: "bg-info/15 text-info border-info/20",
  low: "bg-muted/10 text-muted border-muted/20",
};

const STATUS_COLOR: Record<string, string> = {
  open: "bg-danger/10 text-danger",
  investigating: "bg-warn/10 text-warn",
  resolved: "bg-ok/10 text-ok",
};

function timeSince(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function CreateIncidentModal({ onClose, services }: { onClose: () => void; services: any[] }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [serviceId, setServiceId] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (body: any) =>
      fetch("/api/incidents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["incidents"] }); onClose(); },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-md mx-4">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold">Declare Incident</h2>
          <button onClick={onClose} className="text-muted hover:text-foreground transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-muted mb-1.5">Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="h-8 w-full rounded border border-border bg-surface-2 px-3 text-sm focus:outline-none focus:border-accent/60"
              placeholder="e.g. Payment service degraded" />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              className="w-full rounded border border-border bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:border-accent/60 resize-none"
              placeholder="What's happening?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted mb-1.5">Severity *</label>
              <select value={severity} onChange={e => setSeverity(e.target.value)}
                className="h-8 w-full rounded border border-border bg-surface-2 px-2 text-sm focus:outline-none">
                {["critical", "high", "medium", "low"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Affected Service</label>
              <select value={serviceId} onChange={e => setServiceId(e.target.value)}
                className="h-8 w-full rounded border border-border bg-surface-2 px-2 text-sm focus:outline-none">
                <option value="">— none —</option>
                {services.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5">Assigned To</label>
            <input value={assignedTo} onChange={e => setAssignedTo(e.target.value)}
              className="h-8 w-full rounded border border-border bg-surface-2 px-3 text-sm focus:outline-none focus:border-accent/60"
              placeholder="e.g. lakshay.singh" />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button onClick={onClose} className="h-8 px-4 rounded border border-border text-xs text-muted hover:bg-surface-2 transition-colors">Cancel</button>
          <button
            disabled={!title || create.isPending}
            onClick={() => create.mutate({ title, description: description || null, severity, service_id: serviceId || null, assigned_to: assignedTo || null })}
            className="h-8 px-4 rounded bg-danger text-xs font-medium text-white hover:bg-danger/90 disabled:opacity-50 transition-colors"
          >
            {create.isPending ? "Declaring…" : "Declare Incident"}
          </button>
        </div>
      </div>
    </div>
  );
}

const DEMO_INCIDENTS = [
  { title: "Payment service P99 latency spike — 2.4s", severity: "critical", description: "P99 latency crossed 2.4s threshold. Downstream checkout affected." },
  { title: "Auth service JWT validation errors (ERR_CERT_EXPIRED)", severity: "high", description: "Certificate expired at 03:00 UTC. 12% of login requests failing." },
  { title: "Kafka consumer lag exceeding 50k messages on orders topic", severity: "high", description: "Consumer group rebalance loop detected. Processing throughput dropped 80%." },
  { title: "Memory leak detected in recommendation-service pod", severity: "medium", description: "Pod memory growing at 15MB/min. OOMKill expected within 2 hours." },
  { title: "CDN cache miss rate elevated to 47% (baseline: 8%)", severity: "medium", description: "Edge cache invalidation loop triggered by bad deployment config." },
  { title: "Slow queries on users table — missing index on email column", severity: "low", description: "P95 query time: 850ms. Full table scan on 2.3M rows." },
];

export default function IncidentsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const qc = useQueryClient();

  const { data: incidents = [], isLoading } = useQuery<Incident[]>({
    queryKey: ["incidents", statusFilter],
    queryFn: () => {
      const params = statusFilter ? `?status=${statusFilter}` : "";
      return fetch(`/api/incidents${params}`).then(r => r.json());
    },
    refetchInterval: 30_000,
  });

  const { data: services = [] } = useQuery<any[]>({
    queryKey: ["services"],
    queryFn: () => fetch("/api/services").then(r => r.json()),
  });

  const updateIncident = useMutation({
    mutationFn: ({ id, ...body }: any) =>
      fetch(`/api/incidents/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incidents"] }),
  });

  const seedDemos = async () => {
    setSeeding(true);
    try {
      await Promise.all(DEMO_INCIDENTS.map((d, i) =>
        fetch("/api/incidents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...d, service_id: (services as any[])[i % services.length]?.id ?? null }),
        })
      ));
      qc.invalidateQueries({ queryKey: ["incidents"] });
    } finally {
      setSeeding(false);
    }
  };

  const STATUS_TABS = [
    { value: "", label: "All" },
    { value: "open", label: "Open" },
    { value: "investigating", label: "Investigating" },
    { value: "resolved", label: "Resolved" },
  ];

  const counts = {
    open: incidents.filter(i => i.status === "open").length,
    investigating: incidents.filter(i => i.status === "investigating").length,
    resolved: incidents.filter(i => i.status === "resolved").length,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {showCreate && <CreateIncidentModal onClose={() => setShowCreate(false)} services={services as any[]} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Incidents</h1>
          <p className="mt-0.5 text-sm text-muted">
            {counts.open} open · {counts.investigating} investigating · {counts.resolved} resolved
          </p>
        </div>
        <div className="flex gap-2">
          {incidents.length === 0 && (
            <button
              disabled={seeding}
              onClick={seedDemos}
              className="flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 transition-colors"
            >
              {seeding ? "Seeding…" : "Seed Demo Incidents"}
            </button>
          )}
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-lg bg-danger/90 px-3 py-1.5 text-xs font-medium text-white hover:bg-danger transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Declare Incident
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-border">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              "border-b-2 px-4 py-2 text-xs font-medium transition-colors",
              statusFilter === tab.value ? "border-accent text-foreground" : "border-transparent text-muted hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted">Loading…</div>
        ) : incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <CheckCircle className="h-8 w-8 text-ok" />
            <p className="text-sm font-medium text-ok">No incidents</p>
            <p className="text-xs text-muted">All systems operational.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2/60 text-[11px] uppercase tracking-wide text-muted">
                  <th className="px-4 py-2.5 text-left w-24">Severity</th>
                  <th className="px-4 py-2.5 text-left">Title</th>
                  <th className="px-4 py-2.5 text-left w-32">Service</th>
                  <th className="px-4 py-2.5 text-left w-28">Assigned</th>
                  <th className="px-4 py-2.5 text-left w-24">Opened</th>
                  <th className="px-4 py-2.5 text-left w-28">Status</th>
                  <th className="px-4 py-2.5 text-left w-32">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-surface-2/40 transition-colors">
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase", SEV_COLOR[inc.severity])}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-medium truncate">{inc.title}</p>
                      {inc.description && <p className="text-xs text-muted truncate mt-0.5">{inc.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{inc.service_name ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted">{inc.assigned_to ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted">{timeSince(inc.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", STATUS_COLOR[inc.status])}>
                        {inc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={inc.status}
                        onChange={e => updateIncident.mutate({ id: inc.id, status: e.target.value })}
                        className="h-6 rounded border border-border bg-surface px-1.5 text-[11px] focus:outline-none"
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
