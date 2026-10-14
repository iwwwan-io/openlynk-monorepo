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
  });

  it("never adds --webpack on Vercel even if platform is android", () => {
    const result = resolveNextArgs(
      "build",
      [],
      { VERCEL: "1", TERMUX_VERSION: "0.118.0", NODE_ENV: "production" },
      "android"
    );
    expect(result.args).toEqual(["build"]);
  });

  it("does not add --webpack on standard Linux x64 CI/production environment", () => {
    const result = resolveNextArgs("build", [], { NODE_ENV: "production" }, "linux");
    expect(result.args).toEqual(["build"]);
  });

  it("does not add --webpack on dev command when running on Vercel preview", () => {
    const result = resolveNextArgs(
      "dev",
      [],
      { VERCEL: "1", NODE_ENV: "development" },
      "linux"
    );
    expect(result.args).toEqual(["dev"]);
  });

  it("preserves additional user arguments", () => {
    const result = resolveNextArgs(
      "build",
      ["--debug"],
      { VERCEL: "1", NODE_ENV: "production" },
      "linux"
    );
    expect(result.args).toEqual(["build", "--debug"]);
  });
});
