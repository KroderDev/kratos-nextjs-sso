import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { UiNode } from "@ory/client-fetch";

import {
  getProviderIconClassName,
  getProviderIconColor,
  hasProviderIcon,
  ProviderIcon,
} from "./provider-icon";

function providerNode(value: string) {
  return {
    type: "input",
    group: "oidc",
    messages: [],
    meta: {},
    attributes: {
      node_type: "input",
      name: "provider",
      type: "submit",
      value,
      label: { id: 1, text: `Sign in with ${value}`, type: "info" },
    },
  } as unknown as UiNode;
}

describe("ProviderIcon", () => {
  it("adds a dark-mode contrast class to the Apple mark", () => {
    expect(getProviderIconClassName("Apple")).toContain("dark:invert");
  });

  it("renders Meta branding for Facebook provider values", () => {
    expect(getProviderIconColor("Meta")).toBe("#0866FF");
    expect(getProviderIconColor("Facebook")).toBeUndefined();
  });

  it("renders a library-backed icon for Keycloak", () => {
    expect(hasProviderIcon("Keycloak")).toBe(true);
    const markup = renderToStaticMarkup(<ProviderIcon node={providerNode("keycloak")} />);

    expect(markup).toContain("viewBox=\"0 0 24 24\"");
    expect(markup).toContain("aria-hidden=\"true\"");
  });
});
