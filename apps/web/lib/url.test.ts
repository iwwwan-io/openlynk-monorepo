import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getBaseUrl } from "./url";

describe("getBaseUrl", () => {
  const originalNextPublicAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const originalBetterAuthUrl = process.env.BETTER_AUTH_URL;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.BETTER_AUTH_URL;
  });

  afterEach(() => {
    if (originalNextPublicAppUrl !== undefined) {
      process.env.NEXT_PUBLIC_APP_URL = originalNextPublicAppUrl;
    } else {
      delete process.env.NEXT_PUBLIC_APP_URL;
    }
    if (originalBetterAuthUrl !== undefined) {
      process.env.BETTER_AUTH_URL = originalBetterAuthUrl;
    } else {
      delete process.env.BETTER_AUTH_URL;
    }
  });

  it("returns fallback localhost url when no environment variables are set", () => {
    expect(getBaseUrl()).toBe("http://localhost:3000");
  });

  it("returns NEXT_PUBLIC_APP_URL if defined", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://openlynk.id";
    expect(getBaseUrl()).toBe("https://openlynk.id");
  });

  it("trims trailing slash from base url", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://openlynk.id///";
    expect(getBaseUrl()).toBe("https://openlynk.id");
  });

  it("falls back to BETTER_AUTH_URL when NEXT_PUBLIC_APP_URL is not set", () => {
    process.env.BETTER_AUTH_URL = "https://auth.openlynk.id";
    expect(getBaseUrl()).toBe("https://auth.openlynk.id");
  });
});
