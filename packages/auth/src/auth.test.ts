import { describe, expect, it } from "vitest";
import { auth, createAuth, isGoogleAuthEnabled } from "./index";

describe("Better Auth configuration", () => {
  it("initializes auth instance with required email and password handlers", () => {
    expect(auth).toBeDefined();
    expect(auth.api).toBeDefined();
    expect(typeof auth.api.signUpEmail).toBe("function");
    expect(typeof auth.api.signInEmail).toBe("function");
    expect(typeof auth.api.signOut).toBe("function");
    expect(typeof auth.api.getSession).toBe("function");
  });

  it("allows custom instance creation with createAuth factory", () => {
    const customAuth = createAuth();
    expect(customAuth).toBeDefined();
    expect(typeof customAuth.api.getSession).toBe("function");
  });

  it("accurately detects if Google OAuth is configured via isGoogleAuthEnabled", () => {
    const prevClientId = process.env.GOOGLE_CLIENT_ID;
    const prevClientSecret = process.env.GOOGLE_CLIENT_SECRET;

    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    expect(isGoogleAuthEnabled()).toBe(false);

    process.env.GOOGLE_CLIENT_ID = "mock-id";
    delete process.env.GOOGLE_CLIENT_SECRET;
    expect(isGoogleAuthEnabled()).toBe(false);

    process.env.GOOGLE_CLIENT_SECRET = "mock-secret";
    expect(isGoogleAuthEnabled()).toBe(true);

    if (prevClientId !== undefined) {
      process.env.GOOGLE_CLIENT_ID = prevClientId;
    } else {
      delete process.env.GOOGLE_CLIENT_ID;
    }
    if (prevClientSecret !== undefined) {
      process.env.GOOGLE_CLIENT_SECRET = prevClientSecret;
    } else {
      delete process.env.GOOGLE_CLIENT_SECRET;
    }
  });

  it("initializes auth with Google social provider when env variables are present", () => {
    const prevClientId = process.env.GOOGLE_CLIENT_ID;
    const prevClientSecret = process.env.GOOGLE_CLIENT_SECRET;

    process.env.GOOGLE_CLIENT_ID = "mock-client-id";
    process.env.GOOGLE_CLIENT_SECRET = "mock-client-secret";

    try {
      const customAuth = createAuth();
      expect(customAuth).toBeDefined();
      expect(typeof customAuth.api.getSession).toBe("function");
    } finally {
      if (prevClientId !== undefined) {
        process.env.GOOGLE_CLIENT_ID = prevClientId;
      } else {
        delete process.env.GOOGLE_CLIENT_ID;
      }
      if (prevClientSecret !== undefined) {
        process.env.GOOGLE_CLIENT_SECRET = prevClientSecret;
      } else {
        delete process.env.GOOGLE_CLIENT_SECRET;
      }
    }
  });

  it("preserves default Better Auth account linking behavior (no aggressive auto-linking)", () => {
    const customAuth = createAuth();
    // Verify that customAuth options do not enable implicit linking override
    const options = (
      customAuth as unknown as {
        options?: { account?: { accountLinking?: { enabled?: boolean } } };
      }
    ).options;
    expect(options?.account?.accountLinking?.enabled).toBeUndefined();
  });
});
