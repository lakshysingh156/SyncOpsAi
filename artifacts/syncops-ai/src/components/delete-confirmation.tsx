import React from "react";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Service } from "@/components/services-table";

interface DeleteConfirmationProps {
  isOpen: boolean;
  service?: Service;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading?: boolean;
}

export function DeleteConfirmation({ isOpen, service, onClose, onConfirm, loading = false }: DeleteConfirmationProps) {
  if (!isOpen || !service) return null;

  const handleConfirm = async () => {
    try { await onConfirm(); onClose(); } catch { /* handled by parent */ }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-danger/10">
              <AlertTriangle className="h-5 w-5 text-danger" />
            </div>
            <h2 className="text-lg font-semibold">Delete Service?</h2>
          </div>
          <button onClick={onClose} disabled={loading} className="text-muted hover:text-foreground transition-colors disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <p className="text-sm text-muted">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">&quot;{service.name}&quot;</span>? This action cannot be undone.
          </p>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} disabled={loading}
              className="flex-1 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-2 transition-colors disabled:opacity-50">Cancel</button>
            <button onClick={handleConfirm} disabled={loading}
              className={cn("flex-1 rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-50", loading && "opacity-50 cursor-not-allowed")}>
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
