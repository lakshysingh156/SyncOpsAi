import { useState, useMemo } from "react";
import { TrendingUp, Zap, RefreshCw } from "lucide-react";
import {
  useListServices, useListMetrics, useGetMetricsSummary, useGenerateDemoMetrics,
  getListMetricsQueryKey, getGetMetricsSummaryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const CHART_CFG = {
  latency:    { label: "Latency",    unit: "ms",      color: "#60A5FA", gradient: "grad-latency" },
  error_rate: { label: "Error Rate", unit: "%",       color: "#F87171", gradient: "grad-error" },
  throughput: { label: "Throughput", unit: "req/min", color: "#34D399", gradient: "grad-throughput" },
} as const;

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "#0C0E12", border: "1px solid #1C2029", borderRadius: 5,
    fontSize: 11.5, boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
  },
  labelStyle: { color: "#8896AB", marginBottom: 4 },
  itemStyle: { color: "#E8ECF4" },
};

export default function MetricsPage() {
  const qc = useQueryClient();
  const { data: services = [] } = useListServices();
  const { data: metrics = [], isLoading } = useListMetrics();
  const { data: summary } = useGetMetricsSummary();
  const genMutation = useGenerateDemoMetrics();
  const [selectedSvc, setSelectedSvc] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getListMetricsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetMetricsSummaryQueryKey() });
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try { await genMutation.mutateAsync(); invalidate(); }
    finally { setGenerating(false); }
  };

  const filtered = useMemo(() =>
    selectedSvc ? metrics.filter(m => m.service_id === selectedSvc) : metrics,
    [metrics, selectedSvc]);

  const chartData = useMemo(() => {
    const grouped: Record<string, Record<string, number>> = {};
    filtered.forEach(m => {
      const key = new Date(m.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit" });
      if (!grouped[key]) grouped[key] = {};
      grouped[key][m.metric_type] = m.value;
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, data]) => ({ date, ...data }));
  }, [filtered]);

  const statCards = [
    { label: "AVG LATENCY",    value: summary ? `${summary.avg_latency.toFixed(0)}ms` : "—", color: "#60A5FA" },
    { label: "AVG ERROR RATE", value: summary ? `${summary.avg_error_rate.toFixed(2)}%` : "—", color: "#F87171" },
    { label: "AVG THROUGHPUT", value: summary ? `${summary.avg_throughput.toFixed(0)}` : "—", unit: "req/min", color: "#34D399" },
    { label: "SERVICES",       value: summary ? `${summary.total_services}` : "—", color: "#8B5CF6" },
  ];

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: "#E8ECF4", letterSpacing: "-0.02em" }}>Metrics</h1>
          <p style={{ fontSize: 12, color: "#4E5A6B", marginTop: 2 }}>
            Performance telemetry — <span className="mono" style={{ color: "#8896AB" }}>{metrics.length}</span> data points
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-sm btn-outline-blue" onClick={handleGenerate} disabled={generating}>
            <Zap size={12} />{generating ? "Generating…" : "Generate Data"}
          </button>
          <button className="btn btn-sm btn-ghost" onClick={invalidate}>
            <RefreshCw size={12} style={{ animation: isLoading ? "spin 1s linear infinite" : "none" }} />
          </button>
        </div>
      </div>

      {/* Stat strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
        {statCards.map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: 10, color: "#4E5A6B", fontWeight: 600, letterSpacing: "0.07em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, letterSpacing: "-0.03em" }}>
              {s.value}
              {s.unit && <span style={{ fontSize: 12, fontWeight: 400, color: "#4E5A6B", marginLeft: 4 }}>{s.unit}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Filter row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <label style={{ fontSize: 11.5, color: "#4E5A6B" }}>Service:</label>
        <select
          value={selectedSvc || ""}
          onChange={e => setSelectedSvc(e.target.value || null)}
          className="field field-sm"
          style={{ width: 180 }}
        >
          <option value="">All services</option>
          {(services as any[]).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <span style={{ fontSize: 11, color: "#4E5A6B" }}>({filtered.length} points)</span>
      </div>

      {/* Charts */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {(Object.entries(CHART_CFG) as [string, typeof CHART_CFG[keyof typeof CHART_CFG]][]).map(([key, cfg]) => (
          <div key={key} className="panel" style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, boxShadow: `0 0 8px ${cfg.color}80` }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#E8ECF4" }}>{cfg.label}</span>
              </div>
              <span style={{ fontSize: 11, color: "#4E5A6B" }}>{cfg.unit}</span>
            </div>

            {isLoading ? (
              <div style={{ height: 180, background: "#0F1116", borderRadius: 4, animation: "pulse 1.5s ease-in-out infinite" }} />
            ) : chartData.length === 0 ? (
              <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
                <TrendingUp size={22} style={{ color: "#2E3848" }} />
                <div style={{ fontSize: 12, color: "#4E5A6B" }}>No data yet</div>
                <button className="btn btn-sm btn-outline-blue" onClick={handleGenerate}>
                  <Zap size={11} />Generate demo metrics
                </button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id={cfg.gradient} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={cfg.color} stopOpacity={0.18} />
                      <stop offset="95%" stopColor={cfg.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111318" vertical={false} />
                  <XAxis dataKey="date" stroke="#2E3848" tick={{ fontSize: 10, fill: "#4E5A6B" }} tickLine={false} axisLine={false} />
                  <YAxis stroke="#2E3848" tick={{ fontSize: 10, fill: "#4E5A6B" }} tickLine={false} axisLine={false} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Area
                    type="monotone" dataKey={key}
                    stroke={cfg.color} strokeWidth={1.5}
                    fill={`url(#${cfg.gradient})`}
                    dot={false} activeDot={{ r: 4, fill: cfg.color, strokeWidth: 0 }}
                    name={`${cfg.label} (${cfg.unit})`}
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
