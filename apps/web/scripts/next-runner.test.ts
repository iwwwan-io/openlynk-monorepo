import { describe, expect, it } from "vitest";
import { resolveNextArgs } from "./next-runner.mjs";

describe("resolveNextArgs", () => {
  it("adds --webpack flag on Termux/Android when not on Vercel", () => {
    const result = resolveNextArgs(
      "build",
      [],
      { TERMUX_VERSION: "0.118.0", NODE_ENV: "development" },
      "android"
    );
    expect(result.args).toEqual(["build", "--webpack"]);
    expect(result.shouldDisableWasm).toBe(false);
  });

  it("does not add --webpack on Vercel even if running on android platform", () => {
    const result = resolveNextArgs("build", [], { VERCEL: "1", NODE_ENV: "production" }, "android");
    expect(result.args).toEqual(["build"]);
    expect(result.shouldDisableWasm).toBe(true);
  });

  it("does not add --webpack on standard Linux x64 production environment", () => {
    const result = resolveNextArgs("build", [], { NODE_ENV: "production" }, "linux");
    expect(result.args).toEqual(["build"]);
    expect(result.shouldDisableWasm).toBe(true);
  });

  it("disables SWC-WASM in production when not on Termux", () => {
    const result = resolveNextArgs("dev", [], { NODE_ENV: "production" }, "linux");
    expect(result.shouldDisableWasm).toBe(true);
  });

  it("allows SWC-WASM in Termux development environment", () => {
    const result = resolveNextArgs(
      "dev",
      [],
      { TERMUX_VERSION: "0.118.0", NODE_ENV: "development" },
      "android"
    );
    expect(result.shouldDisableWasm).toBe(false);
  });
});
