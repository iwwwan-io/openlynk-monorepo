/**
 * Mendapatkan base URL aplikasi yang dinormalisasi (tanpa trailing slash).
 * Membaca secara berurutan: NEXT_PUBLIC_APP_URL -> BETTER_AUTH_URL -> fallback http://localhost:3000
 */
export function getBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";

  return url.replace(/\/+$/, "");
}
