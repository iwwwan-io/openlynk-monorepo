import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../schema";

export * from "../schema";
export { schema };
export { and, asc, desc, eq, sql } from "drizzle-orm";

export function createDbClient(connectionString: string) {
  const client = postgres(connectionString);
  return drizzle(client, { schema });
}

export type DbClient = ReturnType<typeof createDbClient>;

export function getDb(): DbClient {
  const connectionString =
    process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/openlynk";
  return createDbClient(connectionString);
}

const connectionString = process.env.DATABASE_URL;
export const db = connectionString ? createDbClient(connectionString) : null;
