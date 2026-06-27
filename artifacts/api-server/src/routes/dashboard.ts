import { Router } from "express";
import { db } from "@workspace/db";
import { servicesTable, metricsTable, logsTable, incidentsTable, deploymentsTable } from "@workspace/db/schema";
import { eq, and, gte, count, avg, sql } from "drizzle-orm";

const router = Router();

router.get("/summary", async (req, res) => {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [services, openIncidents, criticalIncidents, recentDeployments, failedDeployments, metricSummary, totalLogs24h, errorLogs24h] = await Promise.all([
    db.select().from(servicesTable),
    db.select({ count: count() }).from(incidentsTable).where(eq(incidentsTable.status, "open")),
    db.select({ count: count() }).from(incidentsTable).where(and(eq(incidentsTable.status, "open"), eq(incidentsTable.severity, "critical"))),
    db.select({ count: count() }).from(deploymentsTable).where(gte(deploymentsTable.created_at, weekAgo)),
    db.select({ count: count() }).from(deploymentsTable).where(and(eq(deploymentsTable.status, "failed"), gte(deploymentsTable.created_at, weekAgo))),
    db.select({ avg_latency: avg(sql`case when metric_type = 'latency' then value end`), avg_error_rate: avg(sql`case when metric_type = 'error_rate' then value end`), avg_throughput: avg(sql`case when metric_type = 'throughput' then value end`) }).from(metricsTable).where(gte(metricsTable.timestamp, yesterday)),
    db.select({ count: count() }).from(logsTable).where(gte(logsTable.timestamp, yesterday)),
    db.select({ count: count() }).from(logsTable).where(and(eq(logsTable.level, "error"), gte(logsTable.timestamp, yesterday))),
  ]);

  const healthy = services.filter(s => s.tier !== "critical").length;

  res.json({
    total_services: services.length,
    healthy_services: healthy,
    open_incidents: openIncidents[0]?.count ?? 0,
    critical_incidents: criticalIncidents[0]?.count ?? 0,
    recent_deployments: recentDeployments[0]?.count ?? 0,
    failed_deployments: failedDeployments[0]?.count ?? 0,
    avg_error_rate: parseFloat(String(metricSummary[0]?.avg_error_rate ?? 0)) || 0,
    avg_latency: parseFloat(String(metricSummary[0]?.avg_latency ?? 0)) || 0,
    avg_throughput: parseFloat(String(metricSummary[0]?.avg_throughput ?? 0)) || 0,
    total_logs_24h: totalLogs24h[0]?.count ?? 0,
    error_logs_24h: errorLogs24h[0]?.count ?? 0,
  });
});

export { router as dashboardRouter };
