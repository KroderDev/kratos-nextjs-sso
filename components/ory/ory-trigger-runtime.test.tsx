import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  allowedOryTriggers,
  getOryTriggerKey,
  OryTriggerRuntime,
} from "./ory-trigger-runtime";

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

  it("renders no markup for a runtime trigger host", () => {
    expect(renderToStaticMarkup(<OryTriggerRuntime triggers={[]} />)).toBe("");
  });
});
