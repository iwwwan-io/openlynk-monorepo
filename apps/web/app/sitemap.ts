import { getDb, profile } from "@openlynk/db";
import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  try {
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
  } catch (error) {
    console.error("[Sitemap] Gagal mengambil profil kreator dari database:", error);
    return [];
  }
}
