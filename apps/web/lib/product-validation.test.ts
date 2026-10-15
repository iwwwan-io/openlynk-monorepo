import { describe, expect, it } from "vitest";
import {
  formatPriceIdr,
  validateDeliveryUrl,
  validateProductDescription,
  validateProductPrice,
  validateProductTitle,
} from "./product-validation";

describe("validateProductTitle", () => {
  it("accepts valid product titles within 100 characters", () => {
    const res = validateProductTitle("Ebook Panduan Belajar Next.js 16");
    expect(res.valid).toBe(true);
    expect(res.normalized).toBe("Ebook Panduan Belajar Next.js 16");
  });

  it("trims whitespace from product title", () => {
    const res = validateProductTitle("   Preset Lightroom Mobile & Desktop   ");
    expect(res.valid).toBe(true);
    expect(res.normalized).toBe("Preset Lightroom Mobile & Desktop");
  });

  it("accepts title with exactly 100 characters", () => {
    const title100 = "T".repeat(100);
    const res = validateProductTitle(title100);
    expect(res.valid).toBe(true);
    expect(res.normalized).toBe(title100);
  });

  it("rejects empty or whitespace-only product title", () => {
    expect(validateProductTitle("").valid).toBe(false);
    expect(validateProductTitle("   ").valid).toBe(false);
    expect(validateProductTitle(null).valid).toBe(false);
    expect(validateProductTitle(undefined).valid).toBe(false);
  });

  it("rejects title exceeding 100 characters", () => {
    const longTitle = "A".repeat(101);
    const res = validateProductTitle(longTitle);
    expect(res.valid).toBe(false);
    expect(res.error).toContain("maksimal 100 karakter");
  });
});

describe("validateProductDescription", () => {
  it("accepts null, undefined, or empty string as valid nullable description", () => {
    expect(validateProductDescription(null).valid).toBe(true);
    expect(validateProductDescription(null).normalized).toBeNull();
    expect(validateProductDescription(undefined).valid).toBe(true);
    expect(validateProductDescription(undefined).normalized).toBeNull();
    expect(validateProductDescription("").valid).toBe(true);
    expect(validateProductDescription("").normalized).toBeNull();
    expect(validateProductDescription("   ").valid).toBe(true);
    expect(validateProductDescription("   ").normalized).toBeNull();
  });

  it("accepts valid description within 500 characters", () => {
    const desc = "Dapatkan akses langsung ke template Notion dan 50+ materi video pembelajaran.";
    const res = validateProductDescription(desc);
    expect(res.valid).toBe(true);
    expect(res.normalized).toBe(desc);
  });

  it("accepts description with exactly 500 characters", () => {
    const desc500 = "D".repeat(500);
    const res = validateProductDescription(desc500);
    expect(res.valid).toBe(true);
    expect(res.normalized).toBe(desc500);
  });

  it("rejects description exceeding 500 characters", () => {
    const longDesc = "D".repeat(501);
    const res = validateProductDescription(longDesc);
    expect(res.valid).toBe(false);
    expect(res.error).toContain("maksimal 500 karakter");
  });

  it("rejects non-string values that are not null/undefined", () => {
    expect(validateProductDescription(12345).valid).toBe(false);
    expect(validateProductDescription({}).valid).toBe(false);
  });
});

describe("validateProductPrice", () => {
  it("accepts valid integer IDR within range (1.000 to 10.000.000)", () => {
    expect(validateProductPrice(1000).valid).toBe(true);
    expect(validateProductPrice(1000).normalized).toBe(1000);

    expect(validateProductPrice(25000).valid).toBe(true);
    expect(validateProductPrice(25000).normalized).toBe(25000);

    expect(validateProductPrice(10000000).valid).toBe(true);
    expect(validateProductPrice(10000000).normalized).toBe(10000000);
  });

  it("strictly rejects string values (even if string represents a number)", () => {
    expect(validateProductPrice("1000").valid).toBe(false);
    expect(validateProductPrice("1000").error).toContain("bukan string");

    expect(validateProductPrice("25000").valid).toBe(false);
    expect(validateProductPrice("abc").valid).toBe(false);
    expect(validateProductPrice("").valid).toBe(false);
  });

  it("rejects decimal numbers", () => {
    const res1 = validateProductPrice(1000.5);
    expect(res1.valid).toBe(false);
    expect(res1.error).toContain("desimal");

    const res2 = validateProductPrice(25000.99);
    expect(res2.valid).toBe(false);
    expect(res2.error).toContain("desimal");
  });

  it("rejects negative numbers", () => {
    const resNegative = validateProductPrice(-5000);
    expect(resNegative.valid).toBe(false);
    expect(resNegative.error).toContain("negatif");
  });

  it("rejects price below Rp 1.000", () => {
    const zeroRes = validateProductPrice(0);
    expect(zeroRes.valid).toBe(false);
    expect(zeroRes.error).toContain("minimal Rp 1.000");

    const underMin = validateProductPrice(999);
    expect(underMin.valid).toBe(false);
    expect(underMin.error).toContain("minimal Rp 1.000");
  });

  it("rejects price exceeding Rp 10.000.000", () => {
    const overMax = validateProductPrice(10000001);
    expect(overMax.valid).toBe(false);
    expect(overMax.error).toContain("maksimal Rp 10.000.000");
  });

  it("rejects non-numeric and special number values (null, undefined, NaN, Infinity)", () => {
    expect(validateProductPrice(null).valid).toBe(false);
    expect(validateProductPrice(undefined).valid).toBe(false);
    expect(validateProductPrice(NaN).valid).toBe(false);
    expect(validateProductPrice(Infinity).valid).toBe(false);
    expect(validateProductPrice(-Infinity).valid).toBe(false);
  });
});

describe("validateDeliveryUrl", () => {
  it("accepts valid https and http delivery URLs", () => {
    const httpsRes = validateDeliveryUrl("https://drive.google.com/file/d/123/view?usp=sharing");
    expect(httpsRes.valid).toBe(true);
    expect(httpsRes.normalized).toBe("https://drive.google.com/file/d/123/view?usp=sharing");

    const httpRes = validateDeliveryUrl("http://cdn.mysite.com/downloads/bundle.zip");
    expect(httpRes.valid).toBe(true);
  });

  it("rejects malicious protocols like javascript:, data:, and file:", () => {
    expect(validateDeliveryUrl("javascript:alert('malicious')").valid).toBe(false);
    expect(validateDeliveryUrl("data:text/html,<script>alert(1)</script>").valid).toBe(false);
    expect(validateDeliveryUrl("file:///etc/passwd").valid).toBe(false);
    expect(validateDeliveryUrl("ftp://ftp.example.com/archive.zip").valid).toBe(false);
  });

  it("rejects relative URLs or plain text", () => {
    expect(validateDeliveryUrl("/download/ebook.pdf").valid).toBe(false);
    expect(validateDeliveryUrl("drive.google.com/file/123").valid).toBe(false);
    expect(validateDeliveryUrl("not-a-valid-url").valid).toBe(false);
  });

  it("rejects empty or whitespace-only delivery URLs", () => {
    expect(validateDeliveryUrl("").valid).toBe(false);
    expect(validateDeliveryUrl("   ").valid).toBe(false);
    expect(validateDeliveryUrl(null).valid).toBe(false);
  });

  it("rejects delivery URLs exceeding 500 characters", () => {
    const longUrl = "https://example.com/download/" + "a".repeat(480);
    expect(longUrl.length).toBeGreaterThan(500);
    const res = validateDeliveryUrl(longUrl);
    expect(res.valid).toBe(false);
    expect(res.error).toContain("maksimal 500 karakter");
  });
});

describe("formatPriceIdr", () => {
  it("formats integer IDR correctly to standard Indonesian currency string", () => {
    expect(formatPriceIdr(1000)).toBe("Rp 1.000");
    expect(formatPriceIdr(25000)).toBe("Rp 25.000");
    expect(formatPriceIdr(150000)).toBe("Rp 150.000");
    expect(formatPriceIdr(10000000)).toBe("Rp 10.000.000");
  });
});
