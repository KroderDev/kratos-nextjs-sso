import { describe, expect, it } from "vitest";

import { formatString, translatePath } from "./utils";

describe("i18n utilities", () => {
  const dictionary = {
    greeting: "Hello {name}",
    nested: { value: "Nested value" },
    count: 3,
  };

  it("resolves only string leaf values", () => {
    expect(translatePath(dictionary, "greeting")).toBe("Hello {name}");
    expect(translatePath(dictionary, "nested.value")).toBe("Nested value");
    expect(translatePath(dictionary, "nested")).toBeUndefined();
    expect(translatePath(dictionary, "count")).toBeUndefined();
    expect(translatePath(dictionary, "missing.value")).toBeUndefined();
  });

  it("replaces known placeholders while preserving unknown ones", () => {
    expect(formatString("Hello {name}, {count}", { name: "Ada", count: 2 })).toBe(
      "Hello Ada, 2",
    );
    expect(formatString("Hello {name} ({role})", { name: "Ada" })).toBe(
      "Hello Ada ({role})",
    );
    expect(formatString("No parameters")).toBe("No parameters");
  });
});
