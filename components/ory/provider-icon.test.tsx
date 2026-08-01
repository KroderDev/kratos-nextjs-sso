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

  it("adds a dark-mode contrast class to GitHub and X but not other providers", () => {
    expect(getProviderIconClassName("GitHub")).toContain("dark:invert");
    expect(getProviderIconClassName("X")).toContain("dark:invert");
    expect(getProviderIconClassName("Google")).not.toContain("dark:invert");
    expect(getProviderIconClassName("Google")).toContain("size-5 text-foreground");
  });

  it("renders Meta branding for Facebook provider values", () => {
    expect(getProviderIconColor("Meta")).toBe("#0866FF");
    expect(getProviderIconColor("Facebook")).toBeUndefined();
  });

  it("has no custom color for providers other than Meta", () => {
    expect(getProviderIconColor("Google")).toBeUndefined();
    expect(getProviderIconColor("Apple")).toBeUndefined();
  });

  it("renders a library-backed icon for Keycloak", () => {
    expect(hasProviderIcon("Keycloak")).toBe(true);
    const markup = renderToStaticMarkup(<ProviderIcon node={providerNode("keycloak")} />);

    expect(markup).toContain("viewBox=\"0 0 24 24\"");
    expect(markup).toContain("aria-hidden=\"true\"");
  });

  it("reports whether a registered icon exists for a provider name", () => {
    expect(hasProviderIcon("Google")).toBe(true);
    expect(hasProviderIcon("Apple")).toBe(true);
    expect(hasProviderIcon("Keycloak")).toBe(true);
    expect(hasProviderIcon("Some Unregistered Provider")).toBe(false);
  });

  it("renders an iconify-backed icon for Google", () => {
    const markup = renderToStaticMarkup(<ProviderIcon node={providerNode("google")} />);

    expect(markup).toContain("aria-hidden=\"true\"");
  });

  it("falls back to an initial-letter badge when no icon is registered", () => {
    const markup = renderToStaticMarkup(<ProviderIcon node={providerNode("unrecognized-sso")} />);

    expect(markup).toContain(">U<");
  });

  it("falls back to a labeled badge for an unknown provider", () => {
    const node = providerNode("custom-sso");
    node.attributes = {
      ...node.attributes,
      label: undefined,
    } as typeof node.attributes;
    node.meta = {
      label: { id: 1, text: "Sign in with Acme SSO", type: "info" },
    };

    const markup = renderToStaticMarkup(<ProviderIcon node={node} />);

    expect(markup).toContain(">A<");
    expect(markup).toContain("aria-hidden=\"true\"");
  });
});
