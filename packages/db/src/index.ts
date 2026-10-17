import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../schema";

export * from "../schema";
export { schema };
export { and, asc, desc, eq, ne, sql } from "drizzle-orm";

export interface DbClientOptions {
  prepare?: boolean;
}

const globalForDb = globalThis as unknown as {
  postgresClient?: postgres.Sql;
  db?: ReturnType<typeof drizzle<typeof schema>>;
};

export function createDbClient(connectionString: string, options: DbClientOptions = {}) {
  const client = postgres(connectionString, {
    prepare: options.prepare ?? false,
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  return drizzle(client, { schema });
}

export type DbClient = ReturnType<typeof createDbClient>;

export function getDb(): DbClient {
  const connectionString =
    process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/openlynk";

  if (!globalForDb.db) {
    globalForDb.postgresClient = postgres(connectionString, {
      prepare: false,
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    globalForDb.db = drizzle(globalForDb.postgresClient, { schema });
  }

  return globalForDb.db as DbClient;
}

const connectionString = process.env.DATABASE_URL;
export const db = connectionString ? getDb() : null;
