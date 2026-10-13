import { describe, expect, it } from "vitest";
import {
  RESERVED_USERNAMES,
  validateAvatarUrl,
  validateBio,
  validateDisplayName,
  validateLinkTitle,
  validateLinkUrl,
  validateUsername,
} from "./profile-validation";

describe("validateUsername", () => {
  it("accepts valid alphanumeric and underscore usernames", () => {
    expect(validateUsername("kreator_indo").valid).toBe(true);
    expect(validateUsername("kreator_indo").normalized).toBe("kreator_indo");
    expect(validateUsername("user123").valid).toBe(true);
    expect(validateUsername("a_b_c").valid).toBe(true);
    expect(validateUsername("budi_99").valid).toBe(true);
  });

  it("rejects usernames that are too short or too long", () => {
    expect(validateUsername("ab").valid).toBe(false);
    expect(validateUsername("ab").error).toContain("3 hingga 30 karakter");

    const longUsername = "a".repeat(31);
    expect(validateUsername(longUsername).valid).toBe(false);
  });

  it("rejects uppercase characters", () => {
    const res = validateUsername("Kreator");
    expect(res.valid).toBe(false);
    expect(res.error).toContain("huruf kecil (lowercase)");
  });

  it("rejects invalid characters like hyphens, spaces, and punctuation", () => {
    expect(validateUsername("user-name").valid).toBe(false);
    expect(validateUsername("user name").valid).toBe(false);
    expect(validateUsername("user@name").valid).toBe(false);
    expect(validateUsername("user.name").valid).toBe(false);
  });

  it("rejects system reserved keywords", () => {
    for (const reserved of [
      "login",
      "register",
      "dashboard",
      "api",
      "admin",
      "settings",
      "_next",
      "404",
      "500",
      "favicon.ico",
      "robots.txt",
      "sitemap.xml",
      "manifest.json",
    ]) {
      const res = validateUsername(reserved);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("dicadangkan oleh sistem");
    }
  });

  it("verifies RESERVED_USERNAMES set contains all mandatory system routes", () => {
    expect(RESERVED_USERNAMES.has("login")).toBe(true);
    expect(RESERVED_USERNAMES.has("register")).toBe(true);
    expect(RESERVED_USERNAMES.has("dashboard")).toBe(true);
    expect(RESERVED_USERNAMES.has("api")).toBe(true);
    expect(RESERVED_USERNAMES.has("admin")).toBe(true);
    expect(RESERVED_USERNAMES.has("settings")).toBe(true);
    expect(RESERVED_USERNAMES.has("_next")).toBe(true);
    expect(RESERVED_USERNAMES.has("404")).toBe(true);
    expect(RESERVED_USERNAMES.has("500")).toBe(true);
    expect(RESERVED_USERNAMES.has("favicon.ico")).toBe(true);
    expect(RESERVED_USERNAMES.has("robots.txt")).toBe(true);
    expect(RESERVED_USERNAMES.has("sitemap.xml")).toBe(true);
  });

  it("rejects non-string values", () => {
    expect(validateUsername(null).valid).toBe(false);
    expect(validateUsername(undefined).valid).toBe(false);
    expect(validateUsername(12345).valid).toBe(false);
  });
});

describe("validateDisplayName", () => {
  it("accepts valid display names", () => {
    const res = validateDisplayName("Budi Prakoso");
    expect(res.valid).toBe(true);
    expect(res.normalized).toBe("Budi Prakoso");
  });

  it("trims whitespace", () => {
    const res = validateDisplayName("  Siti Aminah  ");
    expect(res.valid).toBe(true);
    expect(res.normalized).toBe("Siti Aminah");
  });

  it("rejects empty or whitespace-only strings", () => {
    expect(validateDisplayName("").valid).toBe(false);
    expect(validateDisplayName("   ").valid).toBe(false);
    expect(validateDisplayName(null).valid).toBe(false);
  });

  it("rejects display names exceeding 100 characters", () => {
    const longName = "A".repeat(101);
    expect(validateDisplayName(longName).valid).toBe(false);
  });
});

describe("validateBio", () => {
  it("accepts null, undefined, or empty string as valid nullable bio", () => {
    expect(validateBio(undefined).normalized).toBeNull();
    expect(validateBio(null).normalized).toBeNull();
    expect(validateBio("").normalized).toBeNull();
    expect(validateBio("   ").normalized).toBeNull();
  });

  it("accepts valid bio within 160 characters", () => {
    const bioText = "Konten kreator edukasi & teknologi di Jakarta.";
    const res = validateBio(bioText);
    expect(res.valid).toBe(true);
    expect(res.normalized).toBe(bioText);
  });

  it("rejects bio exceeding 160 characters", () => {
    const longBio = "X".repeat(161);
    const res = validateBio(longBio);
    expect(res.valid).toBe(false);
    expect(res.error).toContain("160 karakter");
  });
});

describe("validateAvatarUrl", () => {
  it("accepts null, undefined, or empty as valid nullable avatar", () => {
    expect(validateAvatarUrl(null).normalized).toBeNull();
    expect(validateAvatarUrl(undefined).normalized).toBeNull();
    expect(validateAvatarUrl("").normalized).toBeNull();
  });

  it("accepts valid http and https urls", () => {
    expect(validateAvatarUrl("https://example.com/avatar.png").valid).toBe(true);
    expect(validateAvatarUrl("http://cdn.openlynk.id/user.jpg").valid).toBe(true);
  });

  it("rejects unsupported protocols and invalid urls", () => {
    expect(validateAvatarUrl("ftp://example.com/avatar.png").valid).toBe(false);
    expect(validateAvatarUrl("javascript:alert(1)").valid).toBe(false);
    expect(validateAvatarUrl("data:image/svg+xml,<svg></svg>").valid).toBe(false);
    expect(validateAvatarUrl("vbscript:msgbox(1)").valid).toBe(false);
    expect(validateAvatarUrl("file:///etc/passwd").valid).toBe(false);
    expect(validateAvatarUrl("/images/avatar.jpg").valid).toBe(false);
    expect(validateAvatarUrl("//example.com/pic.png").valid).toBe(false);
    expect(validateAvatarUrl("not-a-valid-url").valid).toBe(false);
  });
});

describe("validateLinkTitle", () => {
  it("accepts valid link titles", () => {
    const res = validateLinkTitle("Channel YouTube Saya");
    expect(res.valid).toBe(true);
    expect(res.normalized).toBe("Channel YouTube Saya");
  });

  it("trims whitespace", () => {
    const res = validateLinkTitle("  Instagram Official  ");
    expect(res.valid).toBe(true);
    expect(res.normalized).toBe("Instagram Official");
  });

  it("rejects empty or whitespace-only title", () => {
    expect(validateLinkTitle("").valid).toBe(false);
    expect(validateLinkTitle("   ").valid).toBe(false);
    expect(validateLinkTitle(null).valid).toBe(false);
  });

  it("rejects title exceeding 100 characters", () => {
    const longTitle = "T".repeat(101);
    expect(validateLinkTitle(longTitle).valid).toBe(false);
  });
});

describe("validateLinkUrl", () => {
  it("accepts valid https and http URLs", () => {
    expect(validateLinkUrl("https://instagram.com/openlynk").valid).toBe(true);
    expect(validateLinkUrl("http://myblog.id/post/1").valid).toBe(true);
    expect(validateLinkUrl("https://youtube.com/@kreator").valid).toBe(true);
  });

  it("rejects malicious protocols like javascript: and data:", () => {
    const xssResult = validateLinkUrl("javascript:alert('XSS')");
    expect(xssResult.valid).toBe(false);
    expect(xssResult.error).toContain("http:// atau https://");

    const dataResult = validateLinkUrl("data:text/html,<script>alert(1)</script>");
    expect(dataResult.valid).toBe(false);

    const vbscriptResult = validateLinkUrl("vbscript:msgbox(1)");
    expect(vbscriptResult.valid).toBe(false);

    const fileResult = validateLinkUrl("file:///etc/passwd");
    expect(fileResult.valid).toBe(false);
  });

  it("rejects relative URLs or protocol-relative URLs", () => {
    expect(validateLinkUrl("/dashboard").valid).toBe(false);
    expect(validateLinkUrl("//google.com").valid).toBe(false);
    expect(validateLinkUrl("openlynk.id").valid).toBe(false);
  });

  it("rejects empty or invalid URLs", () => {
    expect(validateLinkUrl("").valid).toBe(false);
    expect(validateLinkUrl("   ").valid).toBe(false);
    expect(validateLinkUrl("not-a-url").valid).toBe(false);
    expect(validateLinkUrl(null).valid).toBe(false);
  });
});
