import { describe, expect, it } from "vitest";

import { allowedOryTriggers, getOryTriggerKey } from "./ory-trigger-runtime";

describe("Ory trigger runtime", () => {
  it("creates a stable key from the trigger list", () => {
    expect(getOryTriggerKey(["oryPasskeyLogin", "oryWebAuthnLogin"])).toBe(
      "oryPasskeyLogin|oryWebAuthnLogin",
    );
    expect(getOryTriggerKey([])).toBe("");
  });

  it("keeps only the supported Ory trigger names allowlisted", () => {
    expect(allowedOryTriggers.has("oryPasskeyLogin")).toBe(true);
    expect(allowedOryTriggers.has("eval")).toBe(false);
  });
});
