import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const logsTable = pgTable("logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  service_id: text("service_id"),
  service_name: text("service_name"),
  level: text("level").notNull().default("info"),
  message: text("message").notNull(),
  trace_id: text("trace_id"),
  metadata: text("metadata"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export type Log = typeof logsTable.$inferSelect;
