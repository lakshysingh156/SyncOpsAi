import { Router } from "express";
import { db, metricsTable, servicesTable } from "@workspace/db";
import { avg, count, desc, eq } from "drizzle-orm";

const router = Router();

router.get("/metrics", async (req, res) => {
  try {
    const metrics = await db.select().from(metricsTable).orderBy(desc(metricsTable.timestamp)).limit(500);
    res.json(metrics);
  } catch (err) {
    req.log.error({ err }, "Failed to list metrics");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/metrics/summary", async (req, res) => {
  try {
    const [latency] = await db
      .select({ avg: avg(metricsTable.value) })
      .from(metricsTable)
      .where(eq(metricsTable.metric_type, "latency"));

    const [errorRate] = await db
      .select({ avg: avg(metricsTable.value) })
      .from(metricsTable)
      .where(eq(metricsTable.metric_type, "error_rate"));

    const [throughput] = await db
      .select({ avg: avg(metricsTable.value) })
      .from(metricsTable)
      .where(eq(metricsTable.metric_type, "throughput"));

    const [serviceCount] = await db.select({ count: count() }).from(servicesTable);

    res.json({
      avg_latency: parseFloat(latency?.avg ?? "0"),
      avg_error_rate: parseFloat(errorRate?.avg ?? "0"),
      avg_throughput: parseFloat(throughput?.avg ?? "0"),
      total_services: serviceCount?.count ?? 0,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get metrics summary");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/metrics/generate-demo-data", async (req, res) => {
  try {
    const services = await db.select().from(servicesTable);
    if (services.length === 0) {
      return res.json({ metrics_generated: 0, services_count: 0 });
    }

    const metricsToInsert: (typeof metricsTable.$inferInsert)[] = [];
    const now = Date.now();

    for (const service of services) {
      for (let i = 0; i < 24; i++) {
        const timestamp = new Date(now - i * 3600 * 1000);
        metricsToInsert.push(
          { service_id: service.id, metric_type: "latency", value: 80 + Math.random() * 120, timestamp },
          { service_id: service.id, metric_type: "error_rate", value: Math.random() * 5, timestamp },
          { service_id: service.id, metric_type: "throughput", value: 100 + Math.random() * 400, timestamp },
        );
      }
    }

    await db.insert(metricsTable).values(metricsToInsert);
    res.json({ metrics_generated: metricsToInsert.length, services_count: services.length });
  } catch (err) {
    req.log.error({ err }, "Failed to generate demo metrics");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
