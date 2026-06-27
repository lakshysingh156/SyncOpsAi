import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, CheckCircle2, XCircle, Clock, RotateCcw, Loader2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Deployment {
  id: string;
  service_id: string | null;
  service_name: string | null;
  version: string;
  status: string;
  environment: string;
  deployed_by: string | null;
  notes: string | null;
  started_at: string;
  finished_at: string | null;
  created_at: string;
}

const STATUS_ICON: Record<string, React.ElementType> = {
  success: CheckCircle2,
  failed: XCircle,
  pending: Clock,
  running: Loader2,
  rolled_back: RotateCcw,
};

const STATUS_COLOR: Record<string, string> = {
  success: "text-ok",
  failed: "text-danger",
  pending: "text-muted",
  running: "text-info",
  rolled_back: "text-warn",
};

const ENV_COLOR: Record<string, string> = {
  production: "bg-danger/10 text-danger border-danger/20",
  staging: "bg-warn/10 text-warn border-warn/20",
  development: "bg-muted/10 text-muted border-muted/20",
};

function duration(start: string, end: string | null) {
  if (!end) return "in progress";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const s = Math.floor(ms / 1000);
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

function CreateDeploymentModal({ onClose, services }: { onClose: () => void; services: any[] }) {
  const [version, setVersion] = useState("");
  const [environment, setEnvironment] = useState("production");
  const [serviceId, setServiceId] = useState("");
  const [deployedBy, setDeployedBy] = useState("lakshay.singh");
  const [notes, setNotes] = useState("");
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (body: any) =>
      fetch("/api/deployments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["deployments"] }); onClose(); },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-md mx-4">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold">New Deployment</h2>
          <button onClick={onClose} className="text-muted hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted mb-1.5">Version *</label>
              <input value={version} onChange={e => setVersion(e.target.value)}
                className="h-8 w-full rounded border border-border bg-surface-2 px-3 text-sm font-mono focus:outline-none focus:border-accent/60"
                placeholder="v2.3.1" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Environment *</label>
              <select value={environment} onChange={e => setEnvironment(e.target.value)}
                className="h-8 w-full rounded border border-border bg-surface-2 px-2 text-sm focus:outline-none">
                <option value="production">production</option>
                <option value="staging">staging</option>
                <option value="development">development</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5">Service</label>
            <select value={serviceId} onChange={e => setServiceId(e.target.value)}
              className="h-8 w-full rounded border border-border bg-surface-2 px-2 text-sm focus:outline-none">
              <option value="">— platform-wide —</option>
              {services.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5">Deployed By</label>
            <input value={deployedBy} onChange={e => setDeployedBy(e.target.value)}
              className="h-8 w-full rounded border border-border bg-surface-2 px-3 text-sm focus:outline-none focus:border-accent/60" />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full rounded border border-border bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:border-accent/60 resize-none"
              placeholder="Changelog, rollout notes…" />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button onClick={onClose} className="h-8 px-4 rounded border border-border text-xs text-muted hover:bg-surface-2">Cancel</button>
          <button
            disabled={!version || create.isPending}
            onClick={() => create.mutate({ version, environment, service_id: serviceId || null, deployed_by: deployedBy || null, notes: notes || null })}
            className="h-8 px-4 rounded bg-accent text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
          >
            {create.isPending ? "Deploying…" : "Deploy"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DeploymentsPage() {
  const [envFilter, setEnvFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();

  const { data: deployments = [], isLoading } = useQuery<Deployment[]>({
    queryKey: ["deployments", envFilter],
    queryFn: () => {
      const params = envFilter ? `?status=${envFilter}` : "";
      return fetch(`/api/deployments${params}`).then(r => r.json());
    },
    refetchInterval: 30_000,
  });

  const { data: services = [] } = useQuery<any[]>({
    queryKey: ["services"],
    queryFn: () => fetch("/api/services").then(r => r.json()),
  });

  const generateDemo = useMutation({
    mutationFn: () => fetch("/api/deployments/generate-demo-data", { method: "POST" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deployments"] }),
  });

  const counts = {
    success: deployments.filter(d => d.status === "success").length,
    failed: deployments.filter(d => d.status === "failed").length,
    running: deployments.filter(d => d.status === "running").length,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {showCreate && <CreateDeploymentModal onClose={() => setShowCreate(false)} services={services as any[]} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Deployments</h1>
          <p className="mt-0.5 text-sm text-muted">
            {deployments.length} total · {counts.success} succeeded · {counts.failed} failed · {counts.running} running
          </p>
        </div>
        <div className="flex gap-2">
          {deployments.length === 0 && (
            <button
              disabled={generateDemo.isPending}
              onClick={() => generateDemo.mutate()}
              className="flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 transition-colors"
            >
              <Zap className="h-3 w-3" />
              {generateDemo.isPending ? "Generating…" : "Generate Demo Data"}
            </button>
          )}
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New Deployment
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Success Rate", value: deployments.length ? `${((counts.success / deployments.length) * 100).toFixed(0)}%` : "—", color: "text-ok" },
          { label: "Failed", value: counts.failed, color: "text-danger" },
          { label: "In Progress", value: counts.running, color: "text-info" },
        ].map(s => (
          <div key={s.label} className="card px-4 py-3 flex items-center gap-3">
            <div>
              <p className="text-[11px] text-muted">{s.label}</p>
              <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted">Loading…</div>
        ) : deployments.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <p className="text-sm text-muted">No deployments yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2/60 text-[11px] uppercase tracking-wide text-muted">
                  <th className="px-4 py-2.5 text-left">Status</th>
                  <th className="px-4 py-2.5 text-left">Version</th>
                  <th className="px-4 py-2.5 text-left">Service</th>
                  <th className="px-4 py-2.5 text-left">Environment</th>
                  <th className="px-4 py-2.5 text-left">Deployed By</th>
                  <th className="px-4 py-2.5 text-left">Duration</th>
                  <th className="px-4 py-2.5 text-left">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {deployments.map((dep) => {
                  const Icon = STATUS_ICON[dep.status] ?? Clock;
                  return (
                    <tr key={dep.id} className="hover:bg-surface-2/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className={cn("flex items-center gap-1.5 text-xs font-medium", STATUS_COLOR[dep.status])}>
                          <Icon className={cn("h-3.5 w-3.5", dep.status === "running" && "animate-spin")} />
                          {dep.status}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-medium">{dep.version}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">{dep.service_name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase", ENV_COLOR[dep.environment])}>
                          {dep.environment}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">{dep.deployed_by ?? "—"}</td>
                      <td className="px-4 py-3 text-xs font-mono text-muted">{duration(dep.started_at, dep.finished_at)}</td>
                      <td className="px-4 py-3 text-xs text-muted">{timeAgo(dep.created_at)}</td>
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
