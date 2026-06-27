import { Router } from "express";
import { db, servicesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/services", async (req, res) => {
  try {
    const services = await db.select().from(servicesTable).orderBy(servicesTable.created_at);
    res.json(services);
  } catch (err) {
    req.log.error({ err }, "Failed to list services");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/services/:id", async (req, res) => {
  try {
    const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, req.params.id));
    if (!service) return res.status(404).json({ error: "Service not found" });
    res.json(service);
  } catch (err) {
    req.log.error({ err }, "Failed to get service");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/services", async (req, res) => {
  try {
    const { name, language, owner_team, tier = "normal", description } = req.body as {
      name: string;
      language?: string | null;
      owner_team?: string | null;
      tier?: string;
      description?: string | null;
    };
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "name is required" });
    }
    const [service] = await db
      .insert(servicesTable)
      .values({ name: name.trim(), language: language || null, owner_team: owner_team || null, tier, description: description || null })
      .returning();
    res.status(201).json(service);
  } catch (err) {
    req.log.error({ err }, "Failed to create service");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/services/:id", async (req, res) => {
  try {
    const [existing] = await db.select().from(servicesTable).where(eq(servicesTable.id, req.params.id));
    if (!existing) return res.status(404).json({ error: "Service not found" });

    const { name, language, owner_team, tier, description } = req.body as {
      name?: string;
      language?: string | null;
      owner_team?: string | null;
      tier?: string;
      description?: string | null;
    };

    const updates: Partial<typeof servicesTable.$inferInsert> = {
      updated_at: new Date(),
    };
    if (name !== undefined) updates.name = name.trim();
    if (language !== undefined) updates.language = language || null;
    if (owner_team !== undefined) updates.owner_team = owner_team || null;
    if (tier !== undefined) updates.tier = tier;
    if (description !== undefined) updates.description = description || null;

    const [updated] = await db
      .update(servicesTable)
      .set(updates)
      .where(eq(servicesTable.id, req.params.id))
      .returning();
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update service");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/services/:id", async (req, res) => {
  try {
    const [existing] = await db.select().from(servicesTable).where(eq(servicesTable.id, req.params.id));
    if (!existing) return res.status(404).json({ error: "Service not found" });
    await db.delete(servicesTable).where(eq(servicesTable.id, req.params.id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete service");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
