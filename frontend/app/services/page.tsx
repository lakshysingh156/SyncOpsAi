"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useServices } from "@/hooks/useServices";
import { useToast, Toast } from "@/components/toast";
import { ServicesTable } from "@/components/services-table";
import { ServiceModal } from "@/components/service-modal";
import { DeleteConfirmation } from "@/components/delete-confirmation";
import type { Service, CreateServiceInput } from "@/lib/api";

export default function ServicesPage() {
  const { services, loading, error, refetch, create, update, delete: deleteService } =
    useServices();
  const { toasts, remove, success, error: errorToast } = useToast();

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Service | undefined>();

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreateClick = () => {
    setEditingService(undefined);
    setIsCreateModalOpen(true);
  };

  const handleEditClick = (service: Service) => {
    setEditingService(service);
    setIsCreateModalOpen(true);
  };

  const handleDeleteClick = (service: Service) => {
    setDeleteTarget(service);
  };

  const handleModalSubmit = async (input: CreateServiceInput) => {
    setIsSubmitting(true);
    try {
      if (editingService) {
        await update(editingService.id, input);
        success(`Updated service "${input.name}"`);
      } else {
        await create(input);
        success(`Created service "${input.name}"`);
      }
      setIsCreateModalOpen(false);
      setEditingService(undefined);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Operation failed";
      errorToast(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await deleteService(deleteTarget.id);
      success(`Deleted service "${deleteTarget.name}"`);
      setDeleteTarget(undefined);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete service";
      errorToast(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Services</h1>
          <p className="mt-1 text-sm text-muted">
            Manage your service catalog and monitor health.
          </p>
        </div>
        <button
          onClick={handleCreateClick}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Service
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Services table */}
      <div className="card overflow-hidden">
        <ServicesTable
          services={services}
          loading={loading}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      </div>

      {/* Modals */}
      <ServiceModal
        isOpen={isCreateModalOpen}
        service={editingService}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingService(undefined);
        }}
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

      {/* Toasts */}
      <div className="fixed bottom-0 right-0 z-40 space-y-2 p-4">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={() => remove(toast.id)}
          />
        ))}
      </div>
    </div>
  );
}
