import { describe, expect, it } from "vitest";
import { auth, createAuth } from "./index";

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
});
