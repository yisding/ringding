import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";

export const scrapeJobs = sqliteTable("scrape_jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  url: text("url").notNull(),
  eventName: text("event_name"),
  cronExpression: text("cron_expression").notNull().default("0 */6 * * *"),
  status: text("status", { enum: ["active", "paused", "error"] })
    .notNull()
    .default("active"),
  lastError: text("last_error"),
  lastScrapedAt: integer("last_scraped_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const priceRecords = sqliteTable(
  "price_records",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    jobId: integer("job_id")
      .notNull()
      .references(() => scrapeJobs.id, { onDelete: "cascade" }),
    price: real("price").notNull(),
    section: text("section"),
    row: text("row"),
    seat: text("seat"),
    quantity: integer("quantity").default(1),
    listingType: text("listing_type"),
    scrapedAt: integer("scraped_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("idx_price_records_job_scraped").on(table.jobId, table.scrapedAt),
  ]
);

export const alertRules = sqliteTable(
  "alert_rules",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    jobId: integer("job_id")
      .notNull()
      .references(() => scrapeJobs.id, { onDelete: "cascade" }),
    type: text("type", {
      enum: ["cheapest_above", "cheapest_below", "avg_deviation"],
    }).notNull(),
    threshold: real("threshold").notNull(),
    email: text("email").notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("idx_alert_rules_job_active").on(table.jobId, table.active)]
);

export const alertHistory = sqliteTable("alert_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  alertId: integer("alert_id")
    .notNull()
    .references(() => alertRules.id, { onDelete: "cascade" }),
  triggeredAt: integer("triggered_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  message: text("message").notNull(),
  cheapestPrice: real("cheapest_price"),
  avgPrice: real("avg_price"),
  trailingAvg: real("trailing_avg"),
});
