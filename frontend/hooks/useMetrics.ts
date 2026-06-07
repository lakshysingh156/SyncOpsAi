/**
 * Hook for managing metrics data.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type Metric, type MetricSummary } from "@/lib/api";

interface UseMetricsReturn {
  metrics: Metric[];
  summary: MetricSummary | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  generateDemo: () => Promise<void>;
}

export function useMetrics(): UseMetricsReturn {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [summary, setSummary] = useState<MetricSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [data, summaryData] = await Promise.all([
        api.getMetrics(),
        api.getMetricsSummary(),
      ]);
      setMetrics(data);
      setSummary(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch metrics");
    } finally {
      setLoading(false);
    }
  }, []);

  const generateDemo = useCallback(async () => {
    try {
      setError(null);
      await api.generateDemoMetrics();
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate demo metrics");
    }
  }, [refetch]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    metrics,
    summary,
    loading,
    error,
    refetch,
    generateDemo,
  };
}
