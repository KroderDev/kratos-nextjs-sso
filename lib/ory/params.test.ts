import { describe, expect, it } from "vitest";

import { buildCleanFlowUrl } from "./params";

describe("buildCleanFlowUrl", () => {
  it("preserves only the explicitly approved parameters", () => {
    expect(
      buildCleanFlowUrl(
        "/auth/login",
        { flow: "expired-flow", lang: "es", return_to: "/dashboard", ignored: "value" },
        ["lang", "return_to"],
      ),
    ).toBe("/auth/login?lang=es&return_to=%2Fdashboard");
  });

  it("preserves repeated values and omits an empty query", () => {
    expect(
      buildCleanFlowUrl("/auth/registration", { lang: ["es", "en"] }, ["lang"]),
    ).toBe("/auth/registration?lang=es&lang=en");
    expect(buildCleanFlowUrl("/auth/login", { flow: "expired" }, ["lang"])).toBe(
      "/auth/login",
    );
  });
});
