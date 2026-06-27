import { Router } from "express";
import { db } from "@workspace/db";
import { incidentsTable } from "@workspace/db/schema";
import { desc, eq, and } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const { status, severity } = req.query as Record<string, string>;
  const conditions = [];
  if (status) conditions.push(eq(incidentsTable.status, status));
  if (severity) conditions.push(eq(incidentsTable.severity, severity));

  const rows = await db
    .select()
    .from(incidentsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(incidentsTable.created_at));

  res.json(rows);
});

router.post("/", async (req, res) => {
  const { title, description, severity, service_id, assigned_to } = req.body;
  if (!title || !severity) return res.status(400).json({ error: "title and severity required" });

  let service_name: string | null = null;
  if (service_id) {
    const { servicesTable } = await import("@workspace/db/schema");
    const [svc] = await db.select().from(servicesTable).where(eq(servicesTable.id, service_id));
    service_name = svc?.name ?? null;
  }

  const [row] = await db
    .insert(incidentsTable)
    .values({ title, description: description ?? null, severity, status: "open", service_id: service_id ?? null, service_name, assigned_to: assigned_to ?? null })
    .returning();
  res.status(201).json(row);
});

router.get("/:id", async (req, res) => {
  const [row] = await db.select().from(incidentsTable).where(eq(incidentsTable.id, req.params.id));
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(row);
});

router.patch("/:id", async (req, res) => {
  const [existing] = await db.select().from(incidentsTable).where(eq(incidentsTable.id, req.params.id));
  if (!existing) return res.status(404).json({ error: "Not found" });

  const { title, description, status, severity, assigned_to } = req.body;
  const update: Record<string, unknown> = { updated_at: new Date() };
  if (title !== undefined) update.title = title;
  if (description !== undefined) update.description = description;
  if (status !== undefined) {
    update.status = status;
    if (status === "resolved") update.resolved_at = new Date();
  }
  if (severity !== undefined) update.severity = severity;
  if (assigned_to !== undefined) update.assigned_to = assigned_to;

  const [row] = await db.update(incidentsTable).set(update).where(eq(incidentsTable.id, req.params.id)).returning();
  res.json(row);
});

export { router as incidentsRouter };
