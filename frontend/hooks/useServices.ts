/**
 * Hook for managing services data and operations.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type CreateServiceInput, type Service, type UpdateServiceInput } from "@/lib/api";

interface UseServicesReturn {
  services: Service[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  create: (input: CreateServiceInput) => Promise<Service>;
  update: (id: string, input: UpdateServiceInput) => Promise<Service>;
  delete: (id: string) => Promise<void>;
}

export function useServices(): UseServicesReturn {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getServices();
      setServices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch services");
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(
    async (input: CreateServiceInput): Promise<Service> => {
      try {
        setError(null);
        const service = await api.createService(input);
        setServices((prev) => [...prev, service]);
        return service;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create service";
        setError(message);
        throw err;
      }
    },
    []
  );

  const update = useCallback(
    async (id: string, input: UpdateServiceInput): Promise<Service> => {
      try {
        setError(null);
        const updated = await api.updateService(id, input);
        setServices((prev) =>
          prev.map((s) => (s.id === id ? updated : s))
        );
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update service";
        setError(message);
        throw err;
      }
    },
    []
  );

  const deleteService = useCallback(
    async (id: string): Promise<void> => {
      try {
        setError(null);
        await api.deleteService(id);
        setServices((prev) => prev.filter((s) => s.id !== id));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete service";
        setError(message);
        throw err;
      }
    },
    []
  );

  // Fetch on mount
  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    services,
    loading,
    error,
    refetch,
    create,
    update,
    delete: deleteService,
  };
}
