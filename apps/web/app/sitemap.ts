import { getDb, profile } from "@openlynk/db";
import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const db = getDb();

  const profiles = await db
    .select({
      username: profile.username,
      updatedAt: profile.updatedAt,
    })
    .from(profile);

  return profiles.map((item) => ({
    url: `${baseUrl}/${item.username}`,
    lastModified: item.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
}
