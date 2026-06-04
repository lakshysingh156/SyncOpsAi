/**
 * Create/Edit Service Modal
 */

"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Service, CreateServiceInput } from "@/lib/api";

interface ServiceModalProps {
  isOpen: boolean;
  service?: Service;
  onClose: () => void;
  onSubmit: (input: CreateServiceInput) => Promise<void>;
  loading?: boolean;
}

export function ServiceModal({
  isOpen,
  service,
  onClose,
  onSubmit,
  loading = false,
}: ServiceModalProps) {
  const [formData, setFormData] = useState<CreateServiceInput>({
    name: "",
    language: "",
    owner_team: "",
    tier: "normal",
    description: "",
  });

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        language: service.language || "",
        owner_team: service.owner_team || "",
        tier: service.tier,
        description: service.description || "",
      });
    } else {
      setFormData({
        name: "",
        language: "",
        owner_team: "",
        tier: "normal",
        description: "",
      });
    }
  }, [service, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(formData);
      onClose();
    } catch {
      // Error is handled by parent component
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">
            {service ? "Edit Service" : "Create Service"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
              Service Name *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              minLength={1}
              maxLength={120}
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
              placeholder="e.g., Auth Service"
              className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
            />
          </div>

          {/* Language */}
          <div>
            <label htmlFor="language" className="block text-sm font-medium text-foreground mb-1.5">
              Language
            </label>
            <input
              id="language"
              name="language"
              type="text"
              maxLength={60}
              value={formData.language || ""}
              onChange={handleChange}
              disabled={loading}
              placeholder="e.g., Python, Go, Node.js"
              className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
            />
          </div>

          {/* Owner Team */}
          <div>
            <label
              htmlFor="owner_team"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Owner Team
            </label>
            <input
              id="owner_team"
              name="owner_team"
              type="text"
              maxLength={120}
              value={formData.owner_team || ""}
              onChange={handleChange}
              disabled={loading}
              placeholder="e.g., Platform Team"
              className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
            />
          </div>

          {/* Tier */}
          <div>
            <label htmlFor="tier" className="block text-sm font-medium text-foreground mb-1.5">
              Tier
            </label>
            <select
              id="tier"
              name="tier"
              value={formData.tier}
              onChange={handleChange}
              disabled={loading}
              className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
            >
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              maxLength={500}
              value={formData.description || ""}
              onChange={handleChange}
              disabled={loading}
              placeholder="Service description (optional)"
              rows={3}
              className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-2 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors disabled:opacity-50",
                loading && "opacity-50 cursor-not-allowed"
              )}
            >
              {loading ? "Saving..." : service ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
