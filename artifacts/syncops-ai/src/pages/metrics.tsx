import { useState, useMemo } from "react";
import { TrendingUp, Zap, RefreshCw } from "lucide-react";
import {
  useListServices, useListMetrics, useGetMetricsSummary, useGenerateDemoMetrics,
  getListMetricsQueryKey, getGetMetricsSummaryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/toast";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

const CHART_TOOLTIP = {
  contentStyle: { backgroundColor: "#14171C", border: "1px solid #242A33", borderRadius: "8px", fontSize: "12px" },
  labelStyle: { color: "#E6EAF0" },
  itemStyle: { color: "#8B95A5" },
};

export default function MetricsPage() {
  const queryClient = useQueryClient();
  const { data: services = [] } = useListServices();
  const { data: metrics = [], isLoading } = useListMetrics();
  const { data: summary } = useGetMetricsSummary();
  const generateMutation = useGenerateDemoMetrics();
  const { success, error: errorToast } = useToast();
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListMetricsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetMetricsSummaryQueryKey() });
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateMutation.mutateAsync();
      await invalidate();
      success("Demo metrics generated");
    } catch {
      errorToast("Failed to generate metrics");
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredMetrics = useMemo(() => {
    if (!selectedServiceId) return metrics;
    return metrics.filter(m => m.service_id === selectedServiceId);
  }, [metrics, selectedServiceId]);

  const chartData = useMemo(() => {
    const grouped: Record<string, Record<string, number>> = {};
    filteredMetrics.forEach((metric) => {
      const key = new Date(metric.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit" });
      if (!grouped[key]) grouped[key] = {};
      grouped[key][metric.metric_type] = metric.value;
    });
    return Object.entries(grouped)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([date, data]) => ({ date, ...data }));
  }, [filteredMetrics]);

  const CHARTS = [
    {
      key: "latency",
      label: "Latency",
      unit: "ms",
      color: "#60A5FA",
      gradientId: "gradLatency",
    },
    {
      key: "error_rate",
      label: "Error Rate",
      unit: "%",
      color: "#F87171",
      gradientId: "gradError",
    },
    {
      key: "throughput",
      label: "Throughput",
      unit: "req/min",
      color: "#34D399",
      gradientId: "gradThru",
    },
  ] as const;

  const statCards = [
    { label: "Avg Latency", value: summary ? `${summary.avg_latency.toFixed(0)}ms` : "—", color: "text-info" },
    { label: "Avg Error Rate", value: summary ? `${summary.avg_error_rate.toFixed(2)}%` : "—", color: "text-danger" },
    { label: "Avg Throughput", value: summary ? `${summary.avg_throughput.toFixed(0)}` : "—", unit: "req/min", color: "text-ok" },
    { label: "Services", value: summary ? String(summary.total_services) : "—", color: "text-accent" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Metrics</h1>
          <p className="mt-0.5 text-sm text-muted">Performance trends — {metrics.length} data points</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 transition-colors"
          >
            <Zap className="h-3 w-3" />
            {isGenerating ? "Generating…" : "Generate Data"}
          </button>
          <button
            onClick={invalidate}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted hover:bg-surface-2 transition-colors"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="stat-tile">
            <p className="text-[11px] text-muted">{s.label}</p>
            <p className={cn("mt-1.5 text-2xl font-bold", s.color)}>
              {s.value}
              {s.unit && <span className="ml-1 text-xs font-normal text-muted">{s.unit}</span>}
            </p>
          </div>
        ))}
      </div>

      {/* Service filter */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted">Filter by service:</label>
        <select
          value={selectedServiceId || ""}
          onChange={e => setSelectedServiceId(e.target.value || null)}
          className="h-7 rounded border border-border bg-surface px-2 text-xs text-foreground focus:outline-none"
        >
          <option value="">All services</option>
          {(services as any[]).map((svc) => (
            <option key={svc.id} value={svc.id}>{svc.name}</option>
          ))}
        </select>
        <span className="text-xs text-muted">({filteredMetrics.length} points)</span>
      </div>

      {/* Charts */}
      <div className="space-y-4">
        {CHARTS.map(({ key, label, unit, color, gradientId }) => (
          <div key={key} className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" style={{ color }} />
                <h2 className="text-sm font-semibold">{label}</h2>
              </div>
              <span className="text-xs text-muted">{unit}</span>
            </div>
            {isLoading ? (
              <div className="h-52 animate-pulse rounded bg-surface-2" />
            ) : chartData.length === 0 ? (
              <div className="flex h-52 items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-muted">No data yet.</p>
                  <button onClick={handleGenerate} className="mt-2 text-xs text-accent hover:underline">Generate demo metrics →</button>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#242A33" />
                  <XAxis dataKey="date" stroke="#8B95A5" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#8B95A5" tick={{ fontSize: 10 }} />
                  <Tooltip {...CHART_TOOLTIP} />
                  <Area
                    type="monotone"
                    dataKey={key}
                    stroke={color}
                    fill={`url(#${gradientId})`}
                    strokeWidth={1.5}
                    dot={false}
                    name={`${label} (${unit})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
