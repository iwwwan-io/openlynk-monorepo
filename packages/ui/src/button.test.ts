import { describe, expect, it } from "vitest";
import { Button } from "./button";

describe("packages/ui", () => {
  it("should export Button component function", () => {
    expect(Button).toBeDefined();
    expect(typeof Button).toBe("function");
  });
});
