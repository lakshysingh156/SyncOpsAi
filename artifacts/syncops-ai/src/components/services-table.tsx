import React from "react";
import { Edit2, Trash2 } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";

export interface Service {
  id: string;
  project_id: string;
  name: string;
  language: string | null;
  owner_team: string | null;
  tier: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface ServicesTableProps {
  services: Service[];
  loading: boolean;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
}

const tierColors: Record<string, string> = {
  critical: "text-danger bg-danger/10 border border-danger/30",
  high: "text-warn bg-warn/10 border border-warn/30",
  normal: "text-accent bg-accent/10 border border-accent/30",
};

export function ServicesTable({ services, loading, onEdit, onDelete }: ServicesTableProps) {
  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-lg border border-border bg-surface animate-pulse" />
        ))}
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface py-12">
        <p className="text-sm text-muted">No services yet</p>
        <p className="mt-1 text-xs text-muted">Create your first service to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Name</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Language</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Owner</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Tier</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Created</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
          </tr>
        </thead>
        <tbody>
          {services.map((service) => (
            <tr key={service.id} className="border-b border-border bg-surface hover:bg-surface-2 transition-colors">
              <td className="px-4 py-3">
                <div>
                  <p className="font-medium text-foreground">{service.name}</p>
                  {service.description && (
                    <p className="mt-1 text-xs text-muted line-clamp-1">{service.description}</p>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-muted">{service.language || "—"}</td>
              <td className="px-4 py-3 text-sm text-muted">{service.owner_team || "—"}</td>
              <td className="px-4 py-3">
                <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", tierColors[service.tier] ?? tierColors.normal)}>
                  {service.tier}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-muted">{formatRelativeTime(service.created_at)}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <button onClick={() => onEdit(service)} className="p-1.5 text-muted hover:text-accent transition-colors rounded hover:bg-surface-2" title="Edit service">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => onDelete(service)} className="p-1.5 text-muted hover:text-danger transition-colors rounded hover:bg-surface-2" title="Delete service">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
