import { useState } from "react";
import { Plus, Server, Zap } from "lucide-react";
import {
  useListServices, useCreateService, useUpdateService, useDeleteService, getListServicesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Toast, useToast } from "@/components/toast";
import { ServicesTable, type Service } from "@/components/services-table";
import { ServiceModal, type ServiceInput } from "@/components/service-modal";
import { DeleteConfirmation } from "@/components/delete-confirmation";

const DEMO_SERVICES = [
  { name: "api-gateway", language: "Go", owner_team: "platform", tier: "critical", description: "Main entry point — routes traffic to all downstream services" },
  { name: "auth-service", language: "Python", owner_team: "identity", tier: "critical", description: "JWT issuance, validation, and OAuth2 provider" },
  { name: "payment-service", language: "TypeScript", owner_team: "payments", tier: "critical", description: "Stripe integration, charge processing, refunds" },
  { name: "user-service", language: "Go", owner_team: "core", tier: "high", description: "User profiles, preferences, account management" },
  { name: "notification-service", language: "Python", owner_team: "platform", tier: "normal", description: "Email, SMS, push notifications via SendGrid & Twilio" },
  { name: "recommendation-engine", language: "Python", owner_team: "ml", tier: "normal", description: "Collaborative filtering model serving via FastAPI" },
  { name: "orders-consumer", language: "Java", owner_team: "commerce", tier: "high", description: "Kafka consumer for order events, downstream fulfillment" },
  { name: "search-service", language: "TypeScript", owner_team: "discovery", tier: "normal", description: "Elasticsearch-backed product and content search" },
];

export default function ServicesPage() {
  const queryClient = useQueryClient();
  const { data: services = [], isLoading: loading, error } = useListServices();
  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const deleteMutation = useDeleteService();
  const { toasts, remove, success, error: errorToast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Service | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });

  const handleModalSubmit = async (input: ServiceInput) => {
    setIsSubmitting(true);
    try {
      if (editingService) {
        await updateMutation.mutateAsync({ id: editingService.id, data: input });
        success(`Updated "${input.name}"`);
      } else {
        await createMutation.mutateAsync({ data: input });
        success(`Created "${input.name}"`);
      }
      await invalidate();
      setIsCreateModalOpen(false);
      setEditingService(undefined);
    } catch (err) {
      errorToast(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync({ id: deleteTarget.id });
      success(`Deleted "${deleteTarget.name}"`);
      await invalidate();
      setDeleteTarget(undefined);
    } catch (err) {
      errorToast(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setIsDeleting(false);
    }
  };

  const seedDemoServices = async () => {
    setSeeding(true);
    try {
      for (const svc of DEMO_SERVICES) {
        await createMutation.mutateAsync({ data: svc as ServiceInput });
      }
      await invalidate();
      success(`Seeded ${DEMO_SERVICES.length} demo services`);
    } catch (err) {
      errorToast("Failed to seed services");
    } finally {
      setSeeding(false);
    }
  };

  const tierCounts = {
    critical: (services as Service[]).filter(s => s.tier === "critical").length,
    high: (services as Service[]).filter(s => s.tier === "high").length,
    normal: (services as Service[]).filter(s => s.tier === "normal").length,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Services</h1>
          <p className="mt-0.5 text-sm text-muted">
            {(services as Service[]).length} services — {tierCounts.critical} critical · {tierCounts.high} high priority · {tierCounts.normal} normal
          </p>
        </div>
        <div className="flex gap-2">
          {(services as Service[]).length === 0 && (
            <button
              disabled={seeding}
              onClick={seedDemoServices}
              className="flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 transition-colors"
            >
              <Zap className="h-3 w-3" />
              {seeding ? "Seeding…" : "Seed Demo Services"}
            </button>
          )}
          <button
            onClick={() => { setEditingService(undefined); setIsCreateModalOpen(true); }}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New Service
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error instanceof Error ? error.message : "Failed to load services"}
        </div>
      )}

      <div className="card overflow-hidden">
        <ServicesTable
          services={services as Service[]}
          loading={loading}
          onEdit={(svc) => { setEditingService(svc); setIsCreateModalOpen(true); }}
          onDelete={(svc) => setDeleteTarget(svc)}
        />
      </div>

      <ServiceModal
        isOpen={isCreateModalOpen}
        service={editingService}
        onClose={() => { setIsCreateModalOpen(false); setEditingService(undefined); }}
        onSubmit={handleModalSubmit}
        loading={isSubmitting}
      />

      <DeleteConfirmation
        isOpen={!!deleteTarget}
        service={deleteTarget}
        onClose={() => setDeleteTarget(undefined)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
      />

      <div className="fixed bottom-0 right-0 z-40 space-y-2 p-4">
        {toasts.map((toast) => (
          <Toast key={toast.id} type={toast.type} message={toast.message} onClose={() => remove(toast.id)} />
        ))}
      </div>
    </div>
  );
}
