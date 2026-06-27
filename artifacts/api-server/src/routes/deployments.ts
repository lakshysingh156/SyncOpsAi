import { Router } from "express";
import { db } from "@workspace/db";
import { deploymentsTable } from "@workspace/db/schema";
import { desc, eq, and } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const { service_id, status } = req.query as Record<string, string>;
  const conditions = [];
  if (service_id) conditions.push(eq(deploymentsTable.service_id, service_id));
  if (status) conditions.push(eq(deploymentsTable.status, status));

  const rows = await db
    .select()
    .from(deploymentsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(deploymentsTable.created_at));

  res.json(rows);
});

router.post("/", async (req, res) => {
  const { service_id, version, environment, deployed_by, notes } = req.body;
  if (!version || !environment) return res.status(400).json({ error: "version and environment required" });

  let service_name: string | null = null;
  if (service_id) {
    const { servicesTable } = await import("@workspace/db/schema");
    const [svc] = await db.select().from(servicesTable).where(eq(servicesTable.id, service_id));
    service_name = svc?.name ?? null;
  }

  const [row] = await db
    .insert(deploymentsTable)
    .values({ service_id: service_id ?? null, service_name, version, status: "running", environment, deployed_by: deployed_by ?? null, notes: notes ?? null })
    .returning();
  res.status(201).json(row);
});

router.patch("/:id", async (req, res) => {
  const [existing] = await db.select().from(deploymentsTable).where(eq(deploymentsTable.id, req.params.id));
  if (!existing) return res.status(404).json({ error: "Not found" });

  const { status, finished_at, notes } = req.body;
  const update: Record<string, unknown> = {};
  if (status !== undefined) update.status = status;
  if (finished_at !== undefined) update.finished_at = finished_at ? new Date(finished_at) : new Date();
  if (notes !== undefined) update.notes = notes;

  const [row] = await db.update(deploymentsTable).set(update).where(eq(deploymentsTable.id, req.params.id)).returning();
  res.json(row);
});

router.post("/generate-demo-data", async (req, res) => {
  const { servicesTable } = await import("@workspace/db/schema");
  const services = await db.select().from(servicesTable).limit(10);

  const versions = ["v1.0.0", "v1.1.0", "v1.1.1", "v1.2.0", "v2.0.0-beta.1", "v2.0.0", "v2.1.0", "v2.1.3", "v2.2.0"];
  const statuses = ["success", "success", "success", "success", "failed", "rolled_back"] as const;
  const envs = ["production", "staging", "production", "production"];
  const deployers = ["lakshay.singh", "github-actions[bot]", "deploy-bot", "ci-pipeline"];
  const now = Date.now();

  const rows = [];
  for (let i = 0; i < 30; i++) {
    const svc = services.length ? services[Math.floor(Math.random() * services.length)] : null;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const startedAt = new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000);
    const duration = Math.floor(Math.random() * 600 + 30) * 1000;
    rows.push({
      service_id: svc?.id ?? null,
      service_name: svc?.name ?? null,
      version: versions[Math.floor(Math.random() * versions.length)],
      status,
      environment: envs[Math.floor(Math.random() * envs.length)],
      deployed_by: deployers[Math.floor(Math.random() * deployers.length)],
      started_at: startedAt,
      finished_at: status !== "pending" ? new Date(startedAt.getTime() + duration) : null,
    });
  }

  await db.insert(deploymentsTable).values(rows);
  res.json({ metrics_generated: rows.length, services_count: services.length });
});

export { router as deploymentsRouter };
