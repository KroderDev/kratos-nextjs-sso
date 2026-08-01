import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("combines conditional class values", () => {
    expect(cn("text-sm", false && "hidden", ["font-medium", null])).toBe(
      "text-sm font-medium",
    );
  });

  it("merges conflicting Tailwind utilities in favor of the last value", () => {
    expect(cn("px-2 text-muted-foreground", "px-4 text-foreground")).toBe(
      "px-4 text-foreground",
    );
  });

  it("returns an empty string when no classes are provided", () => {
    expect(cn()).toBe("");
  });
});
