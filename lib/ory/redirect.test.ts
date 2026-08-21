import { describe, expect, it } from "vitest";

import { isOryFlowRestartRedirect } from "./redirect";

describe("Ory flow redirects", () => {
  it("identifies redirects that restart the matching flow", () => {
    expect(
      isOryFlowRestartRedirect(
        { digest: "NEXT_REDIRECT;replace;https://app.test/self-service/settings/browser;307;" },
        "settings",
      ),
    ).toBe(true);
  });

  it("does not classify unrelated or non-redirect errors", () => {
    expect(
      isOryFlowRestartRedirect(
        { digest: "NEXT_REDIRECT;replace;https://app.test/error;307;" },
        "settings",
      ),
    ).toBe(false);
    expect(isOryFlowRestartRedirect(new Error("failed"), "settings")).toBe(false);
    expect(isOryFlowRestartRedirect({ digest: "NEXT_REDIRECT;" }, "settings")).toBe(false);
    expect(isOryFlowRestartRedirect({ digest: "NOT_A_REDIRECT" }, "settings")).toBe(false);
  });
});
