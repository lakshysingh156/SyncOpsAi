import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const deploymentsTable = pgTable("deployments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  service_id: text("service_id"),
  service_name: text("service_name"),
  version: text("version").notNull(),
  status: text("status").notNull().default("pending"),
  environment: text("environment").notNull().default("production"),
  deployed_by: text("deployed_by"),
  notes: text("notes"),
  started_at: timestamp("started_at").notNull().defaultNow(),
  finished_at: timestamp("finished_at"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export type Deployment = typeof deploymentsTable.$inferSelect;
