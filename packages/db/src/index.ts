import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../schema";

export * from "../schema";

export function createDbClient(connectionString: string) {
  const client = postgres(connectionString);
  return drizzle(client, { schema });
}

export type DbClient = ReturnType<typeof createDbClient>;

const connectionString = process.env.DATABASE_URL;
export const db = connectionString ? createDbClient(connectionString) : null;
