import crypto from "node:crypto";
import type { OrderStatus } from "@openlynk/db";

export interface ValidationResult<T = string> {
  valid: boolean;
  error?: string;
  normalized?: T;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_BUYER_NAME_LENGTH = 2;
export const MAX_BUYER_NAME_LENGTH = 100;
export const MAX_BUYER_EMAIL_LENGTH = 254;

/**
 * Validasi nama pembeli:
 * - Wajib diisi
 * - Panjang 2 hingga 100 karakter setelah trim
 */
export function validateBuyerName(name: unknown): ValidationResult<string> {
  if (typeof name !== "string" || name.trim().length === 0) {
    return { valid: false, error: "Nama pembeli wajib diisi" };
  }

  const trimmed = name.trim();

  if (trimmed.length < MIN_BUYER_NAME_LENGTH) {
    return {
      valid: false,
      error: `Nama pembeli minimal ${MIN_BUYER_NAME_LENGTH} karakter`,
    };
  }

  if (trimmed.length > MAX_BUYER_NAME_LENGTH) {
    return {
      valid: false,
      error: `Nama pembeli maksimal ${MAX_BUYER_NAME_LENGTH} karakter`,
    };
  }

  return { valid: true, normalized: trimmed };
}

/**
 * Validasi email pembeli:
 * - Wajib diisi
 * - Format email standar
 * - Maksimal 254 karakter (RFC 5321)
 */
export function validateBuyerEmail(email: unknown): ValidationResult<string> {
  if (typeof email !== "string" || email.trim().length === 0) {
    return { valid: false, error: "Email pembeli wajib diisi" };
  }

  const trimmed = email.trim().toLowerCase();

  if (trimmed.length > MAX_BUYER_EMAIL_LENGTH) {
    return {
      valid: false,
      error: `Email pembeli maksimal ${MAX_BUYER_EMAIL_LENGTH} karakter`,
    };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: "Format email tidak valid" };
  }

  return { valid: true, normalized: trimmed };
}

export interface VerifyMidtransSignatureParams {
  orderId: string;
  statusCode: string;
  grossAmount: string | number;
  serverKey: string;
  signatureKey: string;
}

/**
 * Verifikasi signature_key Midtrans:
 * SHA512(order_id + status_code + gross_amount + SERVER_KEY)
 * Dibandingkan menggunakan perbandingan timing-safe untuk mencegah timing attacks.
 */
export function verifyMidtransSignature(params: VerifyMidtransSignatureParams): boolean {
  if (
    !params.orderId ||
    !params.statusCode ||
    params.grossAmount === undefined ||
    params.grossAmount === null ||
    !params.serverKey ||
    !params.signatureKey
  ) {
    return false;
  }

  const payload = `${params.orderId}${params.statusCode}${params.grossAmount}${params.serverKey}`;
  const expectedHash = crypto.createHash("sha512").update(payload).digest("hex");

  const expectedBuffer = Buffer.from(expectedHash, "utf-8");
  const actualBuffer = Buffer.from(params.signatureKey, "utf-8");

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

/**
 * Parsing nominal gross_amount dari Midtrans (bisa berformat "25000.00" atau angka).
 * Mengembalikan integer Rupiah tanpa desimal.
 */
export function parseMidtransAmount(grossAmount: unknown): number | null {
  if (typeof grossAmount === "number") {
    if (isNaN(grossAmount) || !isFinite(grossAmount) || grossAmount < 0) {
      return null;
    }
    return Math.round(grossAmount);
  }

  if (typeof grossAmount === "string") {
    const trimmed = grossAmount.trim();
    if (!trimmed) {
      return null;
    }
    const parsed = parseFloat(trimmed);
    if (isNaN(parsed) || !isFinite(parsed) || parsed < 0) {
      return null;
    }
    return Math.round(parsed);
  }

  return null;
}

/**
 * Pemetaan transaction_status Midtrans ke OrderStatus Openlynk:
 * - settlement -> paid
 * - capture dengan fraud_status accept -> paid
 * - pending -> pending
 * - expire -> expired
 * - deny, cancel, failure -> failed
 */
export function mapMidtransStatus(
  transactionStatus: string,
  fraudStatus?: string | null
): OrderStatus | null {
  const status = transactionStatus.toLowerCase();
  const fraud = fraudStatus?.toLowerCase();

  if (status === "settlement") {
    return "paid";
  }

  if (status === "capture") {
    if (fraud === "accept") {
      return "paid";
    }
    if (fraud === "challenge") {
      return "pending";
    }
    return "failed";
  }

  if (status === "pending") {
    return "pending";
  }

  if (status === "expire") {
    return "expired";
  }

  if (status === "deny" || status === "cancel" || status === "failure") {
    return "failed";
  }

  return null;
}

/**
 * Aturan Idempotensi status pesanan:
 * Status "paid" adalah final dan TIDAK BOLEH diturunkan ke status lain (pending, expired, failed).
 */
export function isStatusDowngradeBlocked(
  currentStatus: OrderStatus,
  newStatus: OrderStatus
): boolean {
  if (currentStatus === "paid" && newStatus !== "paid") {
    return true;
  }
  return false;
}

/**
 * Mendapatkan konfigurasi lingkungan Midtrans Snap
 */
export function getMidtransConfig() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
  const clientKey = process.env.MIDTRANS_CLIENT_KEY || "";
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

  const apiBaseUrl = isProduction ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com";

  const snapScriptUrl = isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

  return {
    serverKey,
    clientKey,
    isProduction,
    apiBaseUrl,
    snapScriptUrl,
  };
}
