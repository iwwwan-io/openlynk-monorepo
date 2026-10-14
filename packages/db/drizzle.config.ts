import { defineConfig } from "drizzle-kit";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL_DIRECT) {
    return process.env.DATABASE_URL_DIRECT;
  }
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  const candidatePaths = [
    resolve(process.cwd(), ".env.local"),
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), "apps/web/.env.local"),
    resolve(process.cwd(), "apps/web/.env"),
    resolve(process.cwd(), "../../.env.local"),
    resolve(process.cwd(), "../../.env"),
    resolve(process.cwd(), "../../apps/web/.env.local"),
    resolve(process.cwd(), "../../apps/web/.env"),
  ];
  for (const envPath of candidatePaths) {
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, "utf-8");
      const matchDirect = content.match(/DATABASE_URL_DIRECT=["']?([^"'\r\n]+)["']?/);
      if (matchDirect && matchDirect[1]) {
        return matchDirect[1];
      }
      const match = content.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
      if (match && match[1]) {
        return match[1];
      }
    }
  }
  return "postgresql://postgres:postgres@localhost:5432/openlynk";
}

export default defineConfig({
  schema: "./schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: getDatabaseUrl(),
  },
});
