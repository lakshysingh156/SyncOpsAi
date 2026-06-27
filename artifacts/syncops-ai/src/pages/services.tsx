import { useState } from "react";
import { Plus, Zap, Pencil, Trash2 } from "lucide-react";
import {
  useListServices, useCreateService, useUpdateService, useDeleteService, getListServicesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Toast, useToast } from "@/components/toast";
import { ServiceModal, type ServiceInput } from "@/components/service-modal";
import { DeleteConfirmation } from "@/components/delete-confirmation";

type Service = { id: string; name: string; language?: string | null; owner_team?: string | null; tier: string; description?: string | null; created_at: string; };

const TIER_CFG: Record<string, { color: string; bg: string; border: string }> = {
  critical: { color: "#F87171", bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.2)" },
  high:     { color: "#FB923C", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.2)" },
  normal:   { color: "#8896AB", bg: "rgba(78,90,107,0.08)",  border: "rgba(78,90,107,0.2)" },
};

const LANG_COLORS: Record<string, string> = {
  Go: "#00ADD8", Python: "#3776AB", TypeScript: "#3178C6",
  Java: "#ED8B00", Rust: "#DEA584", Ruby: "#CC342D",
  "C++": "#00599C", "C#": "#512BD4",
};

const DEMO_SVCS: ServiceInput[] = [
  { name: "api-gateway",           language: "Go",         owner_team: "platform",   tier: "critical", description: "Main ingress — routes traffic to all downstream services" },
  { name: "auth-service",          language: "Python",     owner_team: "identity",   tier: "critical", description: "JWT issuance, validation, and OAuth2 provider" },
  { name: "payment-service",       language: "TypeScript", owner_team: "payments",   tier: "critical", description: "Stripe integration, charge processing, refunds" },
  { name: "user-service",          language: "Go",         owner_team: "core",       tier: "high",     description: "User profiles, preferences, account management" },
  { name: "notification-service",  language: "Python",     owner_team: "platform",   tier: "normal",   description: "Email, SMS, push notifications via SendGrid & Twilio" },
  { name: "recommendation-engine", language: "Python",     owner_team: "ml",         tier: "normal",   description: "Collaborative filtering model serving via FastAPI" },
  { name: "orders-consumer",       language: "Java",       owner_team: "commerce",   tier: "high",     description: "Kafka consumer for order events, downstream fulfillment" },
  { name: "search-service",        language: "TypeScript", owner_team: "discovery",  tier: "normal",   description: "Elasticsearch-backed product and content search" },
];

export default function ServicesPage() {
  const qc = useQueryClient();
  const { data: services = [], isLoading, error } = useListServices();
  const createMutation  = useCreateService();
  const updateMutation  = useUpdateService();
  const deleteMutation  = useDeleteService();
  const { toasts, remove, success, error: errToast } = useToast();
  const [modalOpen, setModalOpen]       = useState(false);
  const [editing, setEditing]           = useState<Service | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Service | undefined>();
  const [submitting, setSubmitting]     = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const [seeding, setSeeding]           = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: getListServicesQueryKey() });

  const handleSubmit = async (input: ServiceInput) => {
    setSubmitting(true);
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: input });
        success(`Updated "${input.name}"`);
      } else {
        await createMutation.mutateAsync({ data: input });
        success(`Created "${input.name}"`);
      }
      await invalidate(); setModalOpen(false); setEditing(undefined);
    } catch { errToast("Operation failed"); } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMutation.mutateAsync({ id: deleteTarget.id });
      success(`Deleted "${deleteTarget.name}"`);
      await invalidate(); setDeleteTarget(undefined);
    } catch { errToast("Delete failed"); } finally { setDeleting(false); }
  };

  const seed = async () => {
    setSeeding(true);
    try {
      for (const svc of DEMO_SVCS) await createMutation.mutateAsync({ data: svc });
      await invalidate(); success(`Seeded ${DEMO_SVCS.length} services`);
    } catch { errToast("Seed failed"); } finally { setSeeding(false); }
  };

  const svcs = services as Service[];
  const tierCounts = { critical: svcs.filter(s => s.tier === "critical").length, high: svcs.filter(s => s.tier === "high").length, normal: svcs.filter(s => s.tier === "normal").length };

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: "#E8ECF4", letterSpacing: "-0.02em" }}>Services</h1>
          <p style={{ fontSize: 12, color: "#4E5A6B", marginTop: 2 }}>
            {svcs.length} services — {tierCounts.critical} critical · {tierCounts.high} high · {tierCounts.normal} normal
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {svcs.length === 0 && (
            <button className="btn btn-sm btn-outline-blue" onClick={seed} disabled={seeding}>
              <Zap size={12} />{seeding ? "Seeding…" : "Seed Demo Services"}
            </button>
          )}
          <button className="btn btn-sm btn-blue" onClick={() => { setEditing(undefined); setModalOpen(true); }}>
            <Plus size={12} />New Service
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 5, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#F87171" }}>
          {error instanceof Error ? error.message : "Failed to load services"}
        </div>
      )}

      <div className="panel" style={{ overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#4E5A6B", fontSize: 12 }}>Loading…</div>
        ) : svcs.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "#4E5A6B" }}>No services registered.</div>
            <button className="btn btn-sm btn-outline-blue" style={{ marginTop: 12 }} onClick={seed} disabled={seeding}>
              <Zap size={11} />Seed demo services
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th style={{ width: 90 }}>Language</th>
                  <th style={{ width: 130 }}>Team</th>
                  <th style={{ width: 90 }}>Tier</th>
                  <th style={{ width: 90 }}>Status</th>
                  <th>Description</th>
                  <th style={{ width: 80 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {svcs.map(svc => {
                  const tier = TIER_CFG[svc.tier] ?? TIER_CFG.normal;
                  const langColor = LANG_COLORS[svc.language ?? ""] ?? "#8896AB";
                  return (
                    <tr key={svc.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: 6, background: "rgba(59,130,246,0.1)",
                            border: "1px solid rgba(59,130,246,0.2)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 10, fontWeight: 700, color: "#60A5FA",
                            flexShrink: 0,
                          }}>
                            {svc.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 600, color: "#E8ECF4", fontSize: 13 }}>{svc.name}</span>
                        </div>
                      </td>
                      <td>
                        {svc.language ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: langColor, display: "inline-block" }} />
                            <span style={{ fontSize: 12, color: "#8896AB" }}>{svc.language}</span>
                          </span>
                        ) : <span style={{ color: "#2E3848" }}>—</span>}
                      </td>
                      <td>
                        {svc.owner_team ? (
                          <span style={{ fontSize: 12, color: "#8896AB" }}>{svc.owner_team}</span>
                        ) : <span style={{ color: "#2E3848" }}>—</span>}
                      </td>
                      <td>
                        <span style={{
                          display: "inline-block", borderRadius: 3, padding: "2px 7px",
                          fontSize: 10.5, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase",
                          background: tier.bg, color: tier.color, border: `1px solid ${tier.border}`,
                        }}>{svc.tier}</span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <span className="dot dot-green dot-pulse" />
                          <span style={{ fontSize: 11.5, color: "#10B981" }}>healthy</span>
                        </div>
                      </td>
                      <td style={{ maxWidth: 220 }}>
                        <span style={{ fontSize: 11.5, color: "#4E5A6B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                          {svc.description ?? "—"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            onClick={() => { setEditing(svc); setModalOpen(true); }}
                            style={{ width: 26, height: 26, borderRadius: 4, border: "1px solid #1C2029", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#4E5A6B" }}
                          ><Pencil size={12} /></button>
                          <button
                            onClick={() => setDeleteTarget(svc)}
                            style={{ width: 26, height: 26, borderRadius: 4, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444" }}
                          ><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ServiceModal isOpen={modalOpen} service={editing as any} onClose={() => { setModalOpen(false); setEditing(undefined); }} onSubmit={handleSubmit} loading={submitting} />
      <DeleteConfirmation isOpen={!!deleteTarget} service={deleteTarget as any} onClose={() => setDeleteTarget(undefined)} onConfirm={handleDelete} loading={deleting} />
      <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 40, display: "flex", flexDirection: "column", gap: 8 }}>
        {toasts.map(t => <Toast key={t.id} type={t.type} message={t.message} onClose={() => remove(t.id)} />)}
      </div>
    </div>
  );
}
