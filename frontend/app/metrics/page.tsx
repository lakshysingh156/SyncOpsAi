"use client";

import { useState, useMemo } from "react";
import { Activity } from "lucide-react";
import { useServices } from "@/hooks/useServices";
import { useMetrics } from "@/hooks/useMetrics";
import { useToast } from "@/components/toast";
import type { Service } from "@/lib/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function MetricsPage() {
  const { services, loading: servicesLoading } = useServices();
  const { metrics, summary, loading: metricsLoading, error, generateDemo } = useMetrics();
  const { toasts, remove, success, error: errorToast } = useToast();

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateDemo = async () => {
    setIsGenerating(true);
    try {
      await generateDemo();
      success("Demo metrics generated successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate demo metrics";
      errorToast(message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Filter metrics by selected service or show all
  const filteredMetrics = useMemo(() => {
    if (!selectedServiceId) return metrics;
    return metrics.filter((m) => m.service_id === selectedServiceId);
  }, [metrics, selectedServiceId]);

  // Group metrics by type and date
  const chartData = useMemo(() => {
    const grouped: Record<string, Record<string, number>> = {};

    filteredMetrics.forEach((metric) => {
      const date = new Date(metric.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
      });

      if (!grouped[date]) {
        grouped[date] = {};
      }

      if (metric.metric_type === "latency") {
        grouped[date].latency = metric.value;
      } else if (metric.metric_type === "error_rate") {
        grouped[date].error_rate = metric.value;
      } else if (metric.metric_type === "throughput") {
        grouped[date].throughput = metric.value;
      }
    });

    return Object.entries(grouped)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([date, data]) => ({ date, ...data }));
  }, [filteredMetrics]);

  const loading = metricsLoading || servicesLoading;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Activity className="h-6 w-6 text-accent" />
          <h1 className="text-3xl font-bold text-foreground">Metrics</h1>
        </div>
        <p className="text-muted">Monitor service performance and health metrics.</p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg bg-danger/10 border border-danger p-4">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-surface-2 p-6">
          <p className="text-sm text-muted mb-1">Average Latency</p>
          <p className="text-2xl font-bold text-foreground">
            {summary ? summary.avg_latency.toFixed(0) : "0"}
            <span className="text-sm text-muted ml-1">ms</span>
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface-2 p-6">
          <p className="text-sm text-muted mb-1">Error Rate</p>
          <p className="text-2xl font-bold text-foreground">
            {summary ? summary.avg_error_rate.toFixed(2) : "0"}
            <span className="text-sm text-muted ml-1">%</span>
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface-2 p-6">
          <p className="text-sm text-muted mb-1">Throughput</p>
          <p className="text-2xl font-bold text-foreground">
            {summary ? summary.avg_throughput.toFixed(0) : "0"}
            <span className="text-sm text-muted ml-1">req/min</span>
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface-2 p-6">
          <p className="text-sm text-muted mb-1">Services</p>
          <p className="text-2xl font-bold text-foreground">
            {summary ? summary.total_services : "0"}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm text-muted mb-2">Service</label>
          <select
            value={selectedServiceId || ""}
            onChange={(e) => setSelectedServiceId(e.target.value || null)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground text-sm"
          >
            <option value="">All Services</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={handleGenerateDemo}
            disabled={isGenerating}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 transition-colors disabled:opacity-50"
          >
            {isGenerating ? "Generating..." : "Generate Demo Data"}
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="space-y-6">
        {/* Latency Trend */}
        <div className="rounded-lg border border-border bg-surface-2 p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Latency Trend</h2>
          {loading ? (
            <div className="h-80 bg-surface rounded animate-pulse" />
          ) : chartData.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-muted">
              No data available. Generate demo metrics or wait for real data.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="latency"
                  stroke="#00d9ff"
                  name="Latency (ms)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Error Rate Trend */}
        <div className="rounded-lg border border-border bg-surface-2 p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Error Rate Trend</h2>
          {loading ? (
            <div className="h-80 bg-surface rounded animate-pulse" />
          ) : chartData.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-muted">
              No data available. Generate demo metrics or wait for real data.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="error_rate"
                  stroke="#ff4d4d"
                  name="Error Rate (%)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Throughput Trend */}
        <div className="rounded-lg border border-border bg-surface-2 p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Throughput Trend</h2>
          {loading ? (
            <div className="h-80 bg-surface rounded animate-pulse" />
          ) : chartData.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-muted">
              No data available. Generate demo metrics or wait for real data.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="throughput"
                  stroke="#4d9dff"
                  name="Throughput (req/min)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Toast notifications */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40 space-y-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`rounded-lg px-4 py-3 text-sm font-medium ${
                toast.type === "success"
                  ? "bg-ok/10 text-ok"
                  : toast.type === "error"
                    ? "bg-danger/10 text-danger"
                    : "bg-accent/10 text-accent"
              }`}
            >
              {toast.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
