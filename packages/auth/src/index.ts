import { getDb, schema, type DbClient } from "@openlynk/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export function createAuth(dbInstance: DbClient = getDb()) {
  return betterAuth({
    database: drizzleAdapter(dbInstance, {
      provider: "pg",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL:
      process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  });
}

export const auth = createAuth();
export type Auth = typeof auth;
export { toNextJsHandler } from "better-auth/next-js";
