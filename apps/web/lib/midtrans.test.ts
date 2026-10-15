import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  isStatusDowngradeBlocked,
  mapMidtransStatus,
  parseMidtransAmount,
  validateBuyerEmail,
  validateBuyerName,
  verifyMidtransSignature,
} from "./midtrans";

describe("validateBuyerName", () => {
  it("accepts valid names between 2 and 100 characters", () => {
    const res = validateBuyerName("Budi Prakoso");
    expect(res.valid).toBe(true);
    expect(res.normalized).toBe("Budi Prakoso");
  });

  it("trims whitespace from name", () => {
    const res = validateBuyerName("   Siti Aminah   ");
    expect(res.valid).toBe(true);
    expect(res.normalized).toBe("Siti Aminah");
  });

  it("rejects empty or whitespace-only name", () => {
    expect(validateBuyerName("").valid).toBe(false);
    expect(validateBuyerName("   ").valid).toBe(false);
    expect(validateBuyerName(null).valid).toBe(false);
    expect(validateBuyerName(undefined).valid).toBe(false);
  });

  it("rejects name shorter than 2 characters", () => {
    const res = validateBuyerName("A");
    expect(res.valid).toBe(false);
    expect(res.error).toContain("minimal 2 karakter");
  });

  it("rejects name exceeding 100 characters", () => {
    const longName = "A".repeat(101);
    const res = validateBuyerName(longName);
    expect(res.valid).toBe(false);
    expect(res.error).toContain("maksimal 100 karakter");
  });
});

describe("validateBuyerEmail", () => {
  it("accepts valid email and normalizes to lowercase", () => {
    const res = validateBuyerEmail("User.Test@Example.COM");
    expect(res.valid).toBe(true);
    expect(res.normalized).toBe("user.test@example.com");
  });

  it("rejects invalid email formats", () => {
    expect(validateBuyerEmail("invalid-email").valid).toBe(false);
    expect(validateBuyerEmail("user@").valid).toBe(false);
    expect(validateBuyerEmail("@domain.com").valid).toBe(false);
    expect(validateBuyerEmail("user@domain").valid).toBe(false);
    expect(validateBuyerEmail("").valid).toBe(false);
    expect(validateBuyerEmail(null).valid).toBe(false);
  });

  it("rejects email exceeding 254 characters", () => {
    const longEmail = "a".repeat(245) + "@example.com";
    expect(longEmail.length).toBeGreaterThan(254);
    const res = validateBuyerEmail(longEmail);
    expect(res.valid).toBe(false);
    expect(res.error).toContain("maksimal 254 karakter");
  });
});

describe("verifyMidtransSignature", () => {
  const orderId = "order-12345";
  const statusCode = "200";
  const grossAmount = "25000.00";
  const serverKey = "SB-Mid-server-TESTKEY123";

  function createValidSignature(oId: string, sCode: string, gAmount: string, sKey: string) {
    return crypto
      .createHash("sha512")
      .update(`${oId}${sCode}${gAmount}${sKey}`)
      .digest("hex");
  }

  it("verifies valid signature successfully", () => {
    const signatureKey = createValidSignature(orderId, statusCode, grossAmount, serverKey);
    const isValid = verifyMidtransSignature({
      orderId,
      statusCode,
      grossAmount,
      serverKey,
      signatureKey,
    });
    expect(isValid).toBe(true);
  });

  it("rejects tampered grossAmount", () => {
    const signatureKey = createValidSignature(orderId, statusCode, grossAmount, serverKey);
    const isValid = verifyMidtransSignature({
      orderId,
      statusCode,
      grossAmount: "50000.00", // tampered!
      serverKey,
      signatureKey,
    });
    expect(isValid).toBe(false);
  });

  it("rejects tampered orderId", () => {
    const signatureKey = createValidSignature(orderId, statusCode, grossAmount, serverKey);
    const isValid = verifyMidtransSignature({
      orderId: "order-hacked",
      statusCode,
      grossAmount,
      serverKey,
      signatureKey,
    });
    expect(isValid).toBe(false);
  });

  it("rejects signature signed with different server key", () => {
    const wrongSignature = createValidSignature(orderId, statusCode, grossAmount, "wrong-key");
    const isValid = verifyMidtransSignature({
      orderId,
      statusCode,
      grossAmount,
      serverKey,
      signatureKey: wrongSignature,
    });
    expect(isValid).toBe(false);
  });

  it("rejects arbitrary invalid or empty signature safely without throwing", () => {
    expect(
      verifyMidtransSignature({
        orderId,
        statusCode,
        grossAmount,
        serverKey,
        signatureKey: "invalid_sig_short",
      })
    ).toBe(false);

    expect(
      verifyMidtransSignature({
        orderId: "",
        statusCode,
        grossAmount,
        serverKey,
        signatureKey: "some_sig",
      })
    ).toBe(false);
  });
});

describe("parseMidtransAmount", () => {
  it("parses string decimal amounts from Midtrans properly", () => {
    expect(parseMidtransAmount("25000.00")).toBe(25000);
    expect(parseMidtransAmount("150000.00")).toBe(150000);
    expect(parseMidtransAmount("1000.50")).toBe(1001); // rounded
  });

  it("parses integer strings and numbers", () => {
    expect(parseMidtransAmount("25000")).toBe(25000);
    expect(parseMidtransAmount(25000)).toBe(25000);
  });

  it("rejects invalid, negative, or non-numeric values", () => {
    expect(parseMidtransAmount("abc")).toBeNull();
    expect(parseMidtransAmount("")).toBeNull();
    expect(parseMidtransAmount(-5000)).toBeNull();
    expect(parseMidtransAmount(null)).toBeNull();
    expect(parseMidtransAmount(undefined)).toBeNull();
    expect(parseMidtransAmount(NaN)).toBeNull();
  });
});

describe("mapMidtransStatus", () => {
  it("maps settlement to paid", () => {
    expect(mapMidtransStatus("settlement")).toBe("paid");
  });

  it("maps capture with fraud_status accept to paid", () => {
    expect(mapMidtransStatus("capture", "accept")).toBe("paid");
  });

  it("maps capture with fraud_status challenge to pending", () => {
    expect(mapMidtransStatus("capture", "challenge")).toBe("pending");
  });

  it("maps capture with other fraud_status to failed", () => {
    expect(mapMidtransStatus("capture", "deny")).toBe("failed");
  });

  it("maps pending to pending", () => {
    expect(mapMidtransStatus("pending")).toBe("pending");
  });

  it("maps expire to expired", () => {
    expect(mapMidtransStatus("expire")).toBe("expired");
  });

  it("maps deny, cancel, failure to failed", () => {
    expect(mapMidtransStatus("deny")).toBe("failed");
    expect(mapMidtransStatus("cancel")).toBe("failed");
    expect(mapMidtransStatus("failure")).toBe("failed");
  });

  it("returns null for unknown status", () => {
    expect(mapMidtransStatus("unknown_status")).toBeNull();
  });
});

describe("isStatusDowngradeBlocked (Idempotensi)", () => {
  it("blocks status downgrade from paid to any other status", () => {
    expect(isStatusDowngradeBlocked("paid", "pending")).toBe(true);
    expect(isStatusDowngradeBlocked("paid", "expired")).toBe(true);
    expect(isStatusDowngradeBlocked("paid", "failed")).toBe(true);
  });

  it("allows duplicate paid webhook (idempotent)", () => {
    expect(isStatusDowngradeBlocked("paid", "paid")).toBe(false);
  });

  it("allows transition from pending to paid or terminal states", () => {
    expect(isStatusDowngradeBlocked("pending", "paid")).toBe(false);
    expect(isStatusDowngradeBlocked("pending", "expired")).toBe(false);
    expect(isStatusDowngradeBlocked("pending", "failed")).toBe(false);
  });
});
