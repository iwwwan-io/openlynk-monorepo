import { migrateDatabase } from "@openlynk/db";
import { resolve } from "node:path";

/**
 * Apply committed Drizzle migrations before the Node.js server accepts traffic.
 * The database package serializes concurrent migration attempts with a PostgreSQL advisory lock.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to start Openlynk.");
  }

  await migrateDatabase(
    connectionString,
    resolve(process.cwd(), "../../packages/db/drizzle")
  );
  console.info("[Openlynk] Database migrations are up to date.");
}
