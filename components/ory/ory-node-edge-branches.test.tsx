import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { UiNode } from "@ory/client-fetch";

vi.mock("@/lib/ory/flow", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ory/flow")>();

  return {
    ...actual,
    getNodeLabel: vi.fn(() => undefined),
    getLookupSecretAction: vi.fn((node: UiNode) => {
      const name = (node.attributes as { name?: string } | undefined)?.name;
      return name === "lookup_secret_disable" ? "lookup_secret_disable" : undefined;
    }),
    isProviderNode: vi.fn((node: UiNode) => {
      const attributes = node.attributes as { name?: string } | undefined;
      return attributes?.name === "lookup_secret_disable" || actual.isProviderNode(node);
    }),
  };
});

import { OryNode } from "./ory-node";

function node(
  group: string,
  attributes: Record<string, unknown>,
): UiNode {
  return {
    type: "input",
    group,
    messages: [],
    meta: {},
    attributes: { node_type: "input", ...attributes },
  } as unknown as UiNode;
}

describe("OryNode defensive label and provider branches", () => {
  it("uses translated fallback labels when node labels are absent", () => {
    const codeMarkup = renderToStaticMarkup(
      <OryNode
        node={node("code", { name: "code", type: "text", maxlength: 6 })}
      />,
    );
    const lookupMarkup = renderToStaticMarkup(
      <OryNode
        kind="login"
        node={node("lookup_secret", { name: "lookup_secret", type: "text" })}
      />,
    );
    const totpMarkup = renderToStaticMarkup(
      <OryNode
        kind="settings"
        node={node("totp", { name: "totp_code", type: "text" })}
      />,
    );

    expect(codeMarkup).toContain("Verification code");
    expect(lookupMarkup).toContain("Recovery code");
    expect(totpMarkup).toContain("Authenticator code");
  });

  it("renders a provider icon in a destructive provider action", () => {
    const markup = renderToStaticMarkup(
      <OryNode
        kind="settings"
        node={node("lookup_secret", {
          name: "lookup_secret_disable",
          type: "submit",
          value: "disable",
          label: { id: 1, text: "Disable Google", type: "info" },
        })}
      />,
    );

    expect(markup).toContain('data-slot="alert-dialog-trigger"');
    expect(markup).toContain('aria-hidden="true"');
  });
});
