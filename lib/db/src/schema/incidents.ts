import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const incidentsTable = pgTable("incidents", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("open"),
  severity: text("severity").notNull().default("medium"),
  service_id: text("service_id"),
  service_name: text("service_name"),
  assigned_to: text("assigned_to"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
  resolved_at: timestamp("resolved_at"),
});

export type Incident = typeof incidentsTable.$inferSelect;
