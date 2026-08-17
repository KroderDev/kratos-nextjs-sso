import { describe, expect, it } from "vitest";

import { buildCleanFlowUrl } from "./params";

describe("buildCleanFlowUrl", () => {
  it("preserves only the explicitly approved parameters", () => {
    expect(
      buildCleanFlowUrl(
        "/login",
        { flow: "expired-flow", lang: "es", return_to: "/dashboard", ignored: "value" },
        ["lang", "return_to"],
      ),
    ).toBe("/login?lang=es&return_to=%2Fdashboard");
  });

  it("preserves repeated values and omits an empty query", () => {
    expect(
      buildCleanFlowUrl("/registration", { lang: ["es", "en"] }, ["lang"]),
    ).toBe("/registration?lang=es&lang=en");
    expect(buildCleanFlowUrl("/login", { flow: "expired" }, ["lang"])).toBe(
      "/login",
    );
  });

  it("encodes nested return_to query parameters as one opaque value", () => {
    const callbackUrl =
      "https://provider.example/login/callback?csrf=csrf-token&transaction=transaction-id&flow=login";
    const cleanUrl = buildCleanFlowUrl(
      "/login",
      { return_to: callbackUrl },
      ["return_to"],
    );

    expect(cleanUrl).toContain("%26transaction%3Dtransaction-id");
    expect(
      new URL(cleanUrl, "https://app.example").searchParams.get("return_to"),
    ).toBe(callbackUrl);
  });
});
