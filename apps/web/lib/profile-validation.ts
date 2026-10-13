/**
 * Modul validasi murni untuk Profil Kreator dan Link-in-Bio Openlynk.
 * Dieksekusi di sisi server untuk menjamin integritas data dan keamanan aplikasi.
 */

export const RESERVED_USERNAMES = new Set([
  "login",
  "register",
  "dashboard",
  "api",
  "admin",
  "settings",
  "_next",
  "auth",
  "about",
  "help",
  "terms",
  "privacy",
  "security",
  "favicon",
  "favicon.ico",
  "robots",
  "robots.txt",
  "sitemap",
  "sitemap.xml",
  "openlynk",
  "support",
  "explore",
  "status",
  "docs",
  "404",
  "500",
  "502",
  "503",
  "error",
  "manifest",
  "manifest.json",
  "sw.js",
  "home",
  "index",
  "public",
  "static",
  "assets",
  "null",
  "undefined",
  "me",
  "app",
  "signin",
  "signup",
  "logout",
  "signout",
]);

export interface ValidationResult<T = string> {
  valid: boolean;
  error?: string;
  normalized?: T;
}

/**
 * Validasi username kreator:
 * - Panjang 3 - 30 karakter
 * - Hanya huruf kecil (a-z), angka (0-9), dan garis bawah (_)
 * - Tidak boleh menggunakan kata kunci sistem yang dicadangkan (reserved)
 */
export function validateUsername(username: unknown): ValidationResult<string> {
  if (typeof username !== "string") {
    return { valid: false, error: "Username wajib diisi" };
  }

  const trimmed = username.trim();

  if (trimmed.length < 3 || trimmed.length > 30) {
    return {
      valid: false,
      error: "Username harus memiliki panjang antara 3 hingga 30 karakter",
    };
  }

  if (trimmed !== trimmed.toLowerCase()) {
    return {
      valid: false,
      error: "Username harus menggunakan huruf kecil (lowercase)",
    };
  }

  const nameWithoutExt = trimmed.replace(/\.[a-z0-9]+$/i, "");
  if (RESERVED_USERNAMES.has(trimmed) || RESERVED_USERNAMES.has(nameWithoutExt)) {
    return {
      valid: false,
      error: `Username '${trimmed}' dicadangkan oleh sistem dan tidak dapat digunakan`,
    };
  }

  if (!/^[a-z0-9_]+$/.test(trimmed)) {
    return {
      valid: false,
      error: "Username hanya boleh memuat huruf kecil (a-z), angka (0-9), dan garis bawah (_)",
    };
  }

  return { valid: true, normalized: trimmed };
}

/**
 * Validasi display name kreator:
 * - Wajib diisi (tidak boleh hanya spasi)
 * - Maksimal 100 karakter
 */
export function validateDisplayName(displayName: unknown): ValidationResult<string> {
  if (typeof displayName !== "string" || displayName.trim().length === 0) {
    return { valid: false, error: "Nama tampilan wajib diisi" };
  }

  const trimmed = displayName.trim();

  if (trimmed.length > 100) {
    return { valid: false, error: "Nama tampilan maksimal 100 karakter" };
  }

  return { valid: true, normalized: trimmed };
}

/**
 * Validasi bio profil kreator:
 * - Bersifat opsional (nullable)
 * - Maksimal 160 karakter
 */
export function validateBio(bio: unknown): ValidationResult<string | null> {
  if (bio === undefined || bio === null || typeof bio !== "string" || bio.trim() === "") {
    return { valid: true, normalized: null };
  }

  const trimmed = bio.trim();

  if (trimmed.length > 160) {
    return { valid: false, error: "Bio maksimal 160 karakter" };
  }

  return { valid: true, normalized: trimmed };
}

/**
 * Validasi URL avatar (opsional):
 * - Nullable
 * - Wajib menggunakan protokol http:// atau https:// jika diisi
 */
export function validateAvatarUrl(avatarUrl: unknown): ValidationResult<string | null> {
  if (
    avatarUrl === undefined ||
    avatarUrl === null ||
    typeof avatarUrl !== "string" ||
    avatarUrl.trim() === ""
  ) {
    return { valid: true, normalized: null };
  }

  const trimmed = avatarUrl.trim();

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return {
        valid: false,
        error: "URL avatar harus menggunakan protokol http:// atau https://",
      };
    }
    return { valid: true, normalized: parsed.href };
  } catch {
    return { valid: false, error: "Format URL avatar tidak valid" };
  }
}

/**
 * Validasi judul tautan (link title):
 * - Wajib diisi
 * - Maksimal 100 karakter
 */
export function validateLinkTitle(title: unknown): ValidationResult<string> {
  if (typeof title !== "string" || title.trim().length === 0) {
    return { valid: false, error: "Judul tautan wajib diisi" };
  }

  const trimmed = title.trim();

  if (trimmed.length > 100) {
    return { valid: false, error: "Judul tautan maksimal 100 karakter" };
  }

  return { valid: true, normalized: trimmed };
}

/**
 * Validasi URL tautan (link url):
 * - Wajib diisi
 * - Hanya mengizinkan protokol http:// atau https://
 * - Menolak protokol berbahaya seperti javascript:, data:, vbscript:, file:
 */
export function validateLinkUrl(url: unknown): ValidationResult<string> {
  if (typeof url !== "string" || url.trim().length === 0) {
    return { valid: false, error: "URL tautan wajib diisi" };
  }

  const trimmed = url.trim();

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return {
        valid: false,
        error: "URL hanya boleh menggunakan protokol http:// atau https://",
      };
    }
    return { valid: true, normalized: parsed.href };
  } catch {
    return {
      valid: false,
      error: "Format URL tidak valid (harus dimulai dengan http:// atau https://)",
    };
  }
}
