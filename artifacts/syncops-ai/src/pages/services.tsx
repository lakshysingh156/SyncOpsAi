import { useState } from "react";
import { Plus, Zap, Pencil, Trash2, Activity, Shield, BarChart3 } from "lucide-react";
import {
  useListServices, useCreateService, useUpdateService, useDeleteService, getListServicesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Toast, useToast } from "@/components/toast";
import { ServiceModal, type ServiceInput } from "@/components/service-modal";
import { DeleteConfirmation } from "@/components/delete-confirmation";

type Service = {
  id: string; name: string; language?: string | null;
  owner_team?: string | null; tier: string; description?: string | null; created_at: string;
};

const TIER_CFG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  critical: { color: "#F87171", bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.18)",  label: "Critical" },
  high:     { color: "#FB923C", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.18)", label: "High" },
  normal:   { color: "#7A8899", bg: "rgba(78,90,107,0.06)",  border: "rgba(78,90,107,0.16)",  label: "Normal" },
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

/** Deterministic pseudo-random from string seed */
function seededRand(seed: string, min: number, max: number) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const t = Math.abs(hash % 1000) / 1000;
  return +(min + t * (max - min)).toFixed(1);
}

function serviceStats(svc: Service) {
  const isCrit = svc.tier === "critical";
  const isHigh = svc.tier === "high";
  const latency  = isCrit ? seededRand(svc.name + "lat", 38, 180)  : isHigh ? seededRand(svc.name + "lat", 22, 80) : seededRand(svc.name + "lat", 8, 45);
  const errRate  = isCrit ? seededRand(svc.name + "err", 0.1, 3.2) : isHigh ? seededRand(svc.name + "err", 0.05, 1.2) : seededRand(svc.name + "err", 0.01, 0.5);
  const uptime   = isCrit ? seededRand(svc.name + "up", 98.2, 99.9) : seededRand(svc.name + "up", 99.1, 99.99);
  const health   = Math.round(100 - errRate * 8 - (latency > 100 ? 5 : 0));
  const lastDep  = `v${1 + (Math.abs(svc.name.charCodeAt(0)) % 3)}.${Math.abs(svc.name.charCodeAt(1)) % 5}.${Math.abs(svc.name.charCodeAt(2)) % 10}`;
  return { latency, errRate, uptime, health: Math.min(Math.max(health, 72), 99), lastDep };
}

function healthClass(h: number) {
  if (h >= 96) return "health-great";
  if (h >= 90) return "health-good";
  if (h >= 80) return "health-warn";
  return "health-bad";
}

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
  const [view, setView]                 = useState<"cards" | "table">("cards");

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
  const tierCounts = {
    critical: svcs.filter(s => s.tier === "critical").length,
    high:     svcs.filter(s => s.tier === "high").length,
    normal:   svcs.filter(s => s.tier === "normal").length,
  };

  return (
    <div style={{ maxWidth: 1260, margin: "0 auto" }} className="fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Services</h1>
          <p className="page-sub">
            {svcs.length > 0
              ? `${svcs.length} registered · ${tierCounts.critical} critical · ${tierCounts.high} high · ${tierCounts.normal} normal`
              : "Service intelligence catalog"
            }
          </p>
        </div>
        <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
          {/* View toggle */}
          {svcs.length > 0 && (
            <div style={{
              display: "flex", background: "#0B0D10", border: "1px solid #181D26",
              borderRadius: 5, padding: 2,
            }}>
              {(["cards", "table"] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  style={{
                    padding: "3px 10px", borderRadius: 3, border: "none",
                    background: view === v ? "#181D26" : "transparent",
                    color: view === v ? "#EAECF0" : "#404C5C",
                    fontSize: 11.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                    transition: "all 0.12s",
                  }}
                >
                  {v === "cards" ? "Cards" : "Table"}
                </button>
              ))}
            </div>
          )}
          {svcs.length === 0 && (
            <button className="btn btn-sm btn-outline-blue" onClick={seed} disabled={seeding}>
              <Zap size={11} />{seeding ? "Seeding…" : "Seed Demo Services"}
            </button>
          )}
          <button className="btn btn-sm btn-blue" onClick={() => { setEditing(undefined); setModalOpen(true); }}>
            <Plus size={11} />New Service
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)",
          borderRadius: 5, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#F87171",
        }}>
          {error instanceof Error ? error.message : "Failed to load services"}
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#404C5C", fontSize: 12 }}>
          Loading…
        </div>
      ) : svcs.length === 0 ? (
        <div className="panel" style={{ padding: "56px 20px", textAlign: "center" }}>
          <Shield size={28} style={{ color: "#252E3A", margin: "0 auto 12px", display: "block" }} />
          <div style={{ fontSize: 14, fontWeight: 500, color: "#7A8899", marginBottom: 4 }}>
            No services registered
          </div>
          <div style={{ fontSize: 12, color: "#404C5C", marginBottom: 16, maxWidth: 320, margin: "0 auto 16px" }}>
            Add services to the catalog to enable health scoring, dependency mapping, and incident correlation.
          </div>
          <button className="btn btn-sm btn-outline-blue" onClick={seed} disabled={seeding}>
            <Zap size={11} />Seed demo services
          </button>
        </div>
      ) : view === "cards" ? (
        /* ── Intelligence card grid ── */
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
          gap: 10,
        }}>
          {svcs.map(svc => {
            const stats = serviceStats(svc);
            const tier = TIER_CFG[svc.tier] ?? TIER_CFG.normal;
            const langColor = LANG_COLORS[svc.language ?? ""] ?? "#7A8899";
            return (
              <div key={svc.id} className="service-card">
                {/* Card header */}
                <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid #181D26" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: 6,
                          background: tier.bg, border: `1px solid ${tier.border}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 9.5, fontWeight: 700, color: tier.color,
                          flexShrink: 0,
                        }}>
                          {svc.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{
                            fontSize: 13, fontWeight: 600, color: "#EAECF0",
                            letterSpacing: "-0.01em",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {svc.name}
                          </div>
                        </div>
                      </div>
                      {svc.description && (
                        <div style={{
                          fontSize: 11.5, color: "#404C5C", lineHeight: 1.5,
                          overflow: "hidden", textOverflow: "ellipsis",
                          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any,
                        }}>
                          {svc.description}
                        </div>
                      )}
                    </div>
                    {/* Health ring */}
                    <div className={`health-ring ${healthClass(stats.health)}`} style={{ fontSize: 11 }}>
                      {stats.health}
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display: "flex", borderBottom: "1px solid #181D26" }}>
                  {[
                    { label: "Latency", value: `${stats.latency}ms`, icon: Activity, color: stats.latency > 100 ? "#FBBF24" : "#34D399" },
                    { label: "Errors",  value: `${stats.errRate}%`,  icon: BarChart3, color: stats.errRate > 1 ? "#F87171" : "#34D399" },
                    { label: "Uptime",  value: `${stats.uptime}%`,   icon: Shield,    color: "#60A5FA" },
                  ].map(({ label, value, icon: Icon, color }, i) => (
                    <div key={label} style={{
                      flex: 1, padding: "10px 12px",
                      borderRight: i < 2 ? "1px solid #181D26" : "none",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
                        <Icon size={9} style={{ color }} />
                        <span style={{ fontSize: 9.5, color: "#404C5C", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                          {label}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#EAECF0", letterSpacing: "-0.01em" }}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div style={{ display: "flex", alignItems: "center", padding: "9px 14px", gap: 8 }}>
                  {/* Tier */}
                  <span style={{
                    fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
                    textTransform: "uppercase", color: tier.color,
                    background: tier.bg, border: `1px solid ${tier.border}`,
                    borderRadius: 3, padding: "1px 6px",
                  }}>
                    {svc.tier}
                  </span>
                  {/* Language */}
                  {svc.language && (
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "#7A8899" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: langColor, display: "inline-block" }} />
                      {svc.language}
                    </span>
                  )}
                  {/* Team */}
                  {svc.owner_team && (
                    <span style={{ fontSize: 11, color: "#404C5C", marginLeft: "auto" }}>
                      {svc.owner_team}
                    </span>
                  )}
                  {/* Actions */}
                  <div style={{ display: "flex", gap: 4, marginLeft: svc.owner_team ? 0 : "auto" }}>
                    <button
                      onClick={() => { setEditing(svc); setModalOpen(true); }}
                      style={{
                        width: 24, height: 24, borderRadius: 4,
                        border: "1px solid #181D26", background: "transparent",
                        cursor: "pointer", display: "flex", alignItems: "center",
                        justifyContent: "center", color: "#404C5C", transition: "all 0.12s",
                      }}
                      onMouseEnter={e => { (e.currentTarget as any).style.color = "#7A8899"; (e.currentTarget as any).style.borderColor = "#222A38"; }}
                      onMouseLeave={e => { (e.currentTarget as any).style.color = "#404C5C"; (e.currentTarget as any).style.borderColor = "#181D26"; }}
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(svc)}
                      style={{
                        width: 24, height: 24, borderRadius: 4,
                        border: "1px solid rgba(239,68,68,0.18)", background: "rgba(239,68,68,0.05)",
                        cursor: "pointer", display: "flex", alignItems: "center",
                        justifyContent: "center", color: "#EF4444", transition: "all 0.12s",
                      }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add new card */}
          <div
            onClick={() => { setEditing(undefined); setModalOpen(true); }}
            style={{
              border: "1px dashed #181D26", borderRadius: 6,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexDirection: "column", gap: 6,
              padding: "32px 20px", cursor: "pointer",
              transition: "border-color 0.15s, background 0.15s",
              minHeight: 160,
            }}
            onMouseEnter={e => { (e.currentTarget as any).style.borderColor = "#222A38"; (e.currentTarget as any).style.background = "rgba(255,255,255,0.01)"; }}
            onMouseLeave={e => { (e.currentTarget as any).style.borderColor = "#181D26"; (e.currentTarget as any).style.background = "transparent"; }}
          >
            <Plus size={16} style={{ color: "#252E3A" }} />
            <span style={{ fontSize: 12, color: "#404C5C" }}>Add service</span>
          </div>
        </div>
      ) : (
        /* ── Table view ── */
        <div className="panel" style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th style={{ width: 90 }}>Language</th>
                  <th style={{ width: 120 }}>Team</th>
                  <th style={{ width: 80 }}>Tier</th>
                  <th style={{ width: 80 }}>Health</th>
                  <th style={{ width: 80 }}>Latency</th>
                  <th style={{ width: 80 }}>Errors</th>
                  <th style={{ width: 80 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {svcs.map(svc => {
                  const stats = serviceStats(svc);
                  const tier = TIER_CFG[svc.tier] ?? TIER_CFG.normal;
                  const langColor = LANG_COLORS[svc.language ?? ""] ?? "#7A8899";
                  return (
                    <tr key={svc.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <span className="dot dot-green dot-pulse" />
                          <span style={{ fontWeight: 600, color: "#EAECF0", fontSize: 13 }}>{svc.name}</span>
                        </div>
                      </td>
                      <td>
                        {svc.language ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: langColor, display: "inline-block" }} />
                            <span style={{ fontSize: 12, color: "#7A8899" }}>{svc.language}</span>
                          </span>
                        ) : <span style={{ color: "#252E3A" }}>—</span>}
                      </td>
                      <td><span style={{ fontSize: 12, color: "#7A8899" }}>{svc.owner_team ?? "—"}</span></td>
                      <td>
                        <span style={{
                          borderRadius: 3, padding: "1px 6px", fontSize: 10, fontWeight: 600,
                          letterSpacing: "0.04em", textTransform: "uppercase" as const,
                          background: tier.bg, color: tier.color, border: `1px solid ${tier.border}`,
                        }}>{svc.tier}</span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <span style={{
                            fontSize: 12, fontWeight: 700, color:
                              stats.health >= 96 ? "#34D399" : stats.health >= 90 ? "#60A5FA" : "#FBBF24",
                          }}>{stats.health}</span>
                        </div>
                      </td>
                      <td><span style={{ fontSize: 12, color: stats.latency > 100 ? "#FBBF24" : "#7A8899" }}>{stats.latency}ms</span></td>
                      <td><span style={{ fontSize: 12, color: stats.errRate > 1 ? "#F87171" : "#7A8899" }}>{stats.errRate}%</span></td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            onClick={() => { setEditing(svc); setModalOpen(true); }}
                            style={{ width: 26, height: 26, borderRadius: 4, border: "1px solid #181D26", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#404C5C" }}
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
        </div>
      )}

      <ServiceModal isOpen={modalOpen} service={editing as any} onClose={() => { setModalOpen(false); setEditing(undefined); }} onSubmit={handleSubmit} loading={submitting} />
      <DeleteConfirmation isOpen={!!deleteTarget} service={deleteTarget as any} onClose={() => setDeleteTarget(undefined)} onConfirm={handleDelete} loading={deleting} />
      <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 40, display: "flex", flexDirection: "column", gap: 8 }}>
        {toasts.map(t => <Toast key={t.id} type={t.type} message={t.message} onClose={() => remove(t.id)} />)}
      </div>
    </div>
  );
}
