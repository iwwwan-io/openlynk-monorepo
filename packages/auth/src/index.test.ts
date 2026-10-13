import { describe, expect, it } from "vitest";
import { AUTH_VERSION } from "./index";

describe("packages/auth", () => {
  it("should export auth version", () => {
    expect(AUTH_VERSION).toBe("0.1.0");
  });
});
