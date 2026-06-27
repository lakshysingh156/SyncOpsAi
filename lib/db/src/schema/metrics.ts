import { pgTable, text, doublePrecision, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const metricsTable = pgTable("metrics", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  service_id: text("service_id").notNull(),
  metric_type: text("metric_type").notNull(),
  value: doublePrecision("value").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertMetricSchema = createInsertSchema(metricsTable).omit({
  id: true,
  timestamp: true,
});

export type InsertMetric = z.infer<typeof insertMetricSchema>;
export type Metric = typeof metricsTable.$inferSelect;
