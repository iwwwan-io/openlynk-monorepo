import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { resolve } from "node:path";

/**
 * Apply committed Drizzle migrations before the Node.js server accepts traffic.
 * The PostgreSQL advisory lock prevents concurrent instances from racing migrations.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to start Openlynk.");
  }

  const client = postgres(connectionString, {
    max: 1,
    prepare: false,
    connect_timeout: 10,
  });

  const lockName = "openlynk:drizzle:migrations";

  try {
    await client`SELECT pg_advisory_lock(hashtext(${lockName}))`;
    await migrate(drizzle(client), {
      migrationsFolder: resolve(process.cwd(), "../../packages/db/drizzle"),
    });
    console.info("[Openlynk] Database migrations are up to date.");
  } finally {
    try {
      await client`SELECT pg_advisory_unlock(hashtext(${lockName}))`;
    } finally {
      await client.end();
    }
  }
}
