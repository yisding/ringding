import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "./index";
import path from "node:path";

export function runMigrations() {
  const migrationsFolder = path.join(process.cwd(), "db", "migrations");
  migrate(db, { migrationsFolder });
}
