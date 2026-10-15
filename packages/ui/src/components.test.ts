import { describe, expect, it } from "vitest";
import {
  Badge,
  badgeVariants,
  Button,
  buttonVariants,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  cn,
  Input,
  Label,
  Textarea,
} from "./index";

describe("packages/ui exports", () => {
  it("should export utility cn function", () => {
    expect(typeof cn).toBe("function");
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
    expect(cn("px-2", false && "hidden", "px-4")).toBe("px-4");
  });

  it("should export all requested shadcn components", () => {
    expect(Button).toBeDefined();
    expect(buttonVariants).toBeDefined();
    expect(Input).toBeDefined();
    expect(Label).toBeDefined();
    expect(Textarea).toBeDefined();
    expect(Card).toBeDefined();
    expect(CardHeader).toBeDefined();
    expect(CardTitle).toBeDefined();
    expect(CardDescription).toBeDefined();
    expect(CardContent).toBeDefined();
    expect(CardFooter).toBeDefined();
    expect(Badge).toBeDefined();
    expect(badgeVariants).toBeDefined();
  });
});
