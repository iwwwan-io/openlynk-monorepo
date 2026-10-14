import { describe, expect, it, vi } from "vitest";
import robots from "./robots";
import sitemap, { dynamic, revalidate } from "./sitemap";

let shouldFailDb = false;

vi.mock("@openlynk/db", () => {
  return {
    getDb: () => {
      if (shouldFailDb) {
        throw new Error("Database connection refused");
      }
      return {
        select: () => ({
          from: () =>
            Promise.resolve([
              { username: "budi", updatedAt: new Date("2026-03-01T12:00:00.000Z") },
              { username: "siti", updatedAt: new Date("2026-03-02T15:30:00.000Z") },
            ]),
        }),
      };
    },
    profile: {
      username: "username",
      updatedAt: "updatedAt",
    },
  };
});

describe("robots.ts route metadata", () => {
  it("returns rules allowing public root and disallowing internal routes", () => {
    const config = robots();
    expect(config.sitemap).toContain("/sitemap.xml");
    const rules = Array.isArray(config.rules) ? config.rules[0] : config.rules;
    expect(rules?.allow).toBe("/");
    expect(rules?.disallow).toContain("/dashboard");
    expect(rules?.disallow).toContain("/api/");
  });
});

describe("sitemap.ts route metadata", () => {
  it("exports dynamic configuration for on-demand generation and revalidation", () => {
    expect(dynamic).toBe("force-dynamic");
    expect(revalidate).toBe(3600);
  });

  it("populates sitemap URLs exclusively from creator profiles in DB", async () => {
    shouldFailDb = false;
    const entries = await sitemap();
    expect(entries).toHaveLength(2);
    expect(entries[0]?.url).toContain("/budi");
    expect(entries[0]?.lastModified).toEqual(new Date("2026-03-01T12:00:00.000Z"));
    expect(entries[1]?.url).toContain("/siti");
  });

  it("gracefully returns empty list and does not throw when database is unreachable", async () => {
    shouldFailDb = true;
    const entries = await sitemap();
    expect(entries).toEqual([]);
    shouldFailDb = false;
  });
});
