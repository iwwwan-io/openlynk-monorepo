/**
 * Modul validasi murni untuk Produk Digital Openlynk.
 * Dieksekusi di sisi server untuk menjamin integritas data transaksi dan keamanan link pengiriman.
 */

export interface ValidationResult<T = string> {
  valid: boolean;
  error?: string;
  normalized?: T;
}

export const MIN_PRODUCT_PRICE_IDR = 1000;
export const MAX_PRODUCT_PRICE_IDR = 10000000;
export const MAX_PRODUCT_TITLE_LENGTH = 100;
export const MAX_PRODUCT_DESCRIPTION_LENGTH = 500;
export const MAX_DELIVERY_URL_LENGTH = 500;

/**
 * Validasi judul produk digital:
 * - Wajib diisi (string tidak kosong setelah trim)
 * - Maksimal 100 karakter
 */
export function validateProductTitle(title: unknown): ValidationResult<string> {
  if (typeof title !== "string" || title.trim().length === 0) {
    return { valid: false, error: "Judul produk wajib diisi" };
  }

  const trimmed = title.trim();

  if (trimmed.length > MAX_PRODUCT_TITLE_LENGTH) {
    return {
      valid: false,
      error: `Judul produk maksimal ${MAX_PRODUCT_TITLE_LENGTH} karakter`,
    };
  }

  return { valid: true, normalized: trimmed };
}

/**
 * Validasi deskripsi produk digital:
 * - Bersifat opsional (nullable)
 * - Maksimal 500 karakter jika diisi
 */
export function validateProductDescription(description: unknown): ValidationResult<string | null> {
  if (
    description === undefined ||
    description === null ||
    (typeof description === "string" && description.trim() === "")
  ) {
    return { valid: true, normalized: null };
  }

  if (typeof description !== "string") {
    return { valid: false, error: "Format deskripsi produk tidak valid" };
  }

  const trimmed = description.trim();

  if (trimmed.length > MAX_PRODUCT_DESCRIPTION_LENGTH) {
    return {
      valid: false,
      error: `Deskripsi produk maksimal ${MAX_PRODUCT_DESCRIPTION_LENGTH} karakter`,
    };
  }

  return { valid: true, normalized: trimmed };
}

/**
 * Validasi harga produk digital (IDR):
 * - Wajib berupa bilangan bulat integer (tipe number)
 * - Menolak nilai string
 * - Menolak nilai desimal
 * - Menolak nilai negatif
 * - Minimal Rp 1.000
 * - Maksimal Rp 10.000.000
 */
export function validateProductPrice(price: unknown): ValidationResult<number> {
  if (typeof price === "string") {
    return {
      valid: false,
      error: "Harga produk harus berupa bilangan bulat integer (angka), bukan string",
    };
  }

  if (typeof price !== "number" || Number.isNaN(price) || !Number.isFinite(price)) {
    return { valid: false, error: "Harga produk harus berupa angka yang valid" };
  }

  if (!Number.isInteger(price)) {
    return { valid: false, error: "Harga produk tidak boleh berupa bilangan desimal" };
  }

  if (price < 0) {
    return { valid: false, error: "Harga produk tidak boleh bernilai negatif" };
  }

  if (price < MIN_PRODUCT_PRICE_IDR) {
    return {
      valid: false,
      error: `Harga produk minimal Rp ${MIN_PRODUCT_PRICE_IDR.toLocaleString("id-ID")}`,
    };
  }

  if (price > MAX_PRODUCT_PRICE_IDR) {
    return {
      valid: false,
      error: `Harga produk maksimal Rp ${MAX_PRODUCT_PRICE_IDR.toLocaleString("id-ID")}`,
    };
  }

  return { valid: true, normalized: price };
}

/**
 * Validasi URL pengiriman produk digital:
 * - Wajib diisi
 * - Maksimal 500 karakter
 * - Hanya mengizinkan protokol http:// atau https://
 * - Menolak skema berbahaya (javascript:, data:, file:, dsb.)
 */
export function validateDeliveryUrl(url: unknown): ValidationResult<string> {
  if (typeof url !== "string" || url.trim().length === 0) {
    return { valid: false, error: "URL pengiriman produk wajib diisi" };
  }

  const trimmed = url.trim();

  if (trimmed.length > MAX_DELIVERY_URL_LENGTH) {
    return {
      valid: false,
      error: `URL pengiriman produk maksimal ${MAX_DELIVERY_URL_LENGTH} karakter`,
    };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return {
        valid: false,
        error: "URL pengiriman hanya boleh menggunakan protokol http:// atau https://",
      };
    }
    return { valid: true, normalized: parsed.href };
  } catch {
    return {
      valid: false,
      error: "Format URL pengiriman tidak valid (harus dimulai dengan http:// atau https://)",
    };
  }
}

/**
 * Format nominal uang integer IDR ke tampilan rupiah standar:
 * Contoh: 25000 -> "Rp 25.000"
 */
export function formatPriceIdr(price: number): string {
  return `Rp ${new Intl.NumberFormat("id-ID").format(price)}`;
}
