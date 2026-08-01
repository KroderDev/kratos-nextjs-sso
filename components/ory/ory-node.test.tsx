import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { UiNode } from "@ory/client-fetch";

import { OryNode } from "./ory-node";

function submitNode(overrides: Record<string, unknown> = {}): UiNode {
  return {
    type: "input",
    group: "password",
    messages: [],
    meta: {},
    attributes: {
      node_type: "input",
      name: "method",
      type: "submit",
      value: "password",
      label: { id: 1, text: "Sign in", type: "info" },
      ...overrides,
    },
  } as unknown as UiNode;
}

function providerNode(overrides: Record<string, unknown> = {}): UiNode {
  return submitNode({
    group: "oidc",
    name: "provider",
    type: "submit",
    value: "google-provider",
    label: { id: 1, text: "Sign in with Google", type: "info" },
    ...overrides,
  });
}

describe("OryNode submit/button rendering", () => {
  it("renders a regular submit button with its label and a trailing arrow icon", () => {
    const markup = renderToStaticMarkup(<OryNode node={submitNode()} />);

    expect(markup).toContain(">Sign in<");
    expect(markup).toContain('type="submit"');
    expect(markup).toContain('data-icon="inline-end"');
    expect(markup).not.toContain("formnovalidate");
  });

  it("renders the button type attribute for button inputs", () => {
    const markup = renderToStaticMarkup(
      <OryNode node={submitNode({ type: "button", name: "resend", label: { id: 1, text: "Resend", type: "info" } })} />,
    );

    expect(markup).toContain('type="button"');
    expect(markup).toContain(">Resend<");
  });

  it("shows the localized login label for the login method submit action", () => {
    const markup = renderToStaticMarkup(
      <OryNode kind="login" node={submitNode({ name: "method", label: { id: 1, text: "Sign in" } })} />,
    );

    expect(markup).toContain(">Login<");
  });

  it("does not override the label when the flow kind is not login", () => {
    const markup = renderToStaticMarkup(
      <OryNode kind="registration" node={submitNode({ name: "method", label: { id: 1, text: "Sign in" } })} />,
    );

    expect(markup).toContain(">Sign in<");
    expect(markup).not.toContain(">Login<");
  });

  it("does not override the label when the submit node is not named 'method'", () => {
    const markup = renderToStaticMarkup(
      <OryNode kind="login" node={submitNode({ name: "resend_code", label: { id: 1, text: "Resend code" } })} />,
    );

    expect(markup).toContain(">Resend code<");
    expect(markup).not.toContain(">Login<");
  });

  it("renders a non-compact provider button with the provider icon and accessible action text", () => {
    const markup = renderToStaticMarkup(<OryNode kind="login" node={providerNode()} />);

    expect(markup).toContain(">Continue with Google<");
    expect(markup).toContain('class="flex-1 text-left"');
    expect(markup).toContain("formNoValidate");
    expect(markup).not.toContain('data-icon="inline-end"');
    expect(markup).not.toContain('aria-label="Continue with Google"');
  });

  it("renders a compact provider button as icon-only with screen-reader text", () => {
    const markup = renderToStaticMarkup(
      <OryNode compactProvider kind="login" node={providerNode()} />,
    );

    expect(markup).toContain('aria-label="Continue with Google"');
    expect(markup).toContain('title="Continue with Google"');
    expect(markup).toContain('class="sr-only"');
    expect(markup).toContain(">Continue with Google<");
    expect(markup).not.toContain('class="flex-1 text-left"');
    expect(markup).not.toContain('data-icon="inline-end"');
  });

  it("falls back to a generic provider name when none can be determined", () => {
    const markup = renderToStaticMarkup(
      <OryNode
        kind="login"
        node={providerNode({ value: "unrecognized-sso", label: undefined })}
      />,
    );

    expect(markup).toContain(">Continue with Provider<");
  });
});
