import { Router } from "express";
import { db } from "@workspace/db";
import { logsTable } from "@workspace/db/schema";
import { desc, eq, ilike, and, gte } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const { service_id, level, search, limit = "200" } = req.query as Record<string, string>;
  const conditions = [];
  if (service_id) conditions.push(eq(logsTable.service_id, service_id));
  if (level) conditions.push(eq(logsTable.level, level));
  if (search) conditions.push(ilike(logsTable.message, `%${search}%`));

  const rows = await db
    .select()
    .from(logsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(logsTable.timestamp))
    .limit(parseInt(limit));

  res.json(rows);
});

router.post("/", async (req, res) => {
  const { service_id, level, message, trace_id, metadata } = req.body;
  const [row] = await db
    .insert(logsTable)
    .values({ service_id: service_id ?? null, level: level ?? "info", message, trace_id: trace_id ?? null, metadata: metadata ?? null })
    .returning();
  res.status(201).json(row);
});

router.post("/generate-demo-data", async (req, res) => {
  const { servicesTable } = await import("@workspace/db/schema");
  const services = await db.select().from(servicesTable).limit(10);

  const MESSAGES: Record<string, string[]> = {
    info: [
      "Server started on port 8080",
      "Connected to PostgreSQL database",
      "Cache warmed up: 1,240 entries loaded",
      "Health check passed",
      "Background job scheduled: metrics aggregation",
      "Request processed successfully",
      "Token refreshed for user session",
      "Kafka consumer group rebalanced",
      "Config reloaded from environment",
      "S3 snapshot upload completed",
    ],
    warn: [
      "High memory usage detected: 82%",
      "Slow query detected (>500ms): SELECT * FROM metrics",
      "Retry attempt 2 of 3 for payment gateway",
      "Rate limit approaching for external API",
      "Disk usage at 74%, consider cleanup",
      "Connection pool utilization: 90%",
    ],
    error: [
      "Database connection timeout after 5000ms",
      "Failed to process message from queue: deserialization error",
      "HTTP 503 from upstream service: payment-service",
      "Panic recovered: index out of bounds",
      "Authentication failed: invalid JWT signature",
      "Redis connection refused on port 6379",
    ],
    debug: [
      "Cache miss for key: user:profile:1234",
      "Request headers: {content-type: application/json}",
      "SQL query executed in 12ms",
      "Span created: trace_id=abc123",
      "Feature flag 'new_dashboard' evaluated: true",
    ],
  };

  const levels = ["debug", "info", "info", "info", "warn", "warn", "error"] as const;
  const traceChars = "abcdef0123456789";
  const genTrace = () => Array.from({ length: 16 }, () => traceChars[Math.floor(Math.random() * traceChars.length)]).join("");

  const rows = [];
  const now = Date.now();

  for (let i = 0; i < 150; i++) {
    const level = levels[Math.floor(Math.random() * levels.length)];
    const msgs = MESSAGES[level];
    const msg = msgs[Math.floor(Math.random() * msgs.length)];
    const svc = services.length ? services[Math.floor(Math.random() * services.length)] : null;
    const ts = new Date(now - Math.random() * 24 * 60 * 60 * 1000);
    rows.push({
      service_id: svc?.id ?? null,
      service_name: svc?.name ?? null,
      level,
      message: msg,
      trace_id: Math.random() > 0.3 ? genTrace() : null,
      metadata: JSON.stringify({ host: `pod-${Math.floor(Math.random() * 8)}`, env: "production" }),
      timestamp: ts,
    });
  }

  await db.insert(logsTable).values(rows);
  res.json({ metrics_generated: rows.length, services_count: services.length });
});

export { router as logsRouter };
