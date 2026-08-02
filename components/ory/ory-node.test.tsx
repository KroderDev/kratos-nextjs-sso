import { renderToStaticMarkup } from "react-dom/server";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import type { UiNode } from "@ory/client-fetch";

vi.mock("@/lib/ory/security", () => ({
  allowedOryOrigins: () => ["https://example.com"],
  isSafeProviderUrl: (href: string | undefined) => {
    if (!href) return false;
    if (href.startsWith("/")) return true;
    try {
      return new URL(href).origin === "https://example.com";
    } catch {
      return false;
    }
  },
  isSafeFlowAction: (action: string | undefined) => {
    if (!action) return false;
    return action.startsWith("/") || action.startsWith("https://");
  },
}));
vi.mock("next/script", () => ({
  __esModule: true,
  default: ({ src, strategy, ...props }: Record<string, unknown>) =>
    React.createElement("script", { src, "data-strategy": strategy, ...props }),
}));

import { OryNode } from "./ory-node";

function baseNode(
  type: string,
  group: string,
  overrides: Record<string, unknown> = {},
): UiNode {
  return {
    type,
    group,
    messages: [],
    meta: {},
    attributes: { node_type: type, ...overrides },
  } as unknown as UiNode;
}

function inputNode(overrides: Record<string, unknown> = {}): UiNode {
  return baseNode("input", "password", {
    name: "method",
    type: "submit",
    value: "password",
    label: { id: 1, text: "Sign in", type: "info" },
    ...overrides,
  });
}

function submitNode(overrides: Record<string, unknown> = {}): UiNode {
  return inputNode(overrides);
}

function providerNode(overrides: Record<string, unknown> = {}): UiNode {
  return {
    ...submitNode({
      name: "provider",
      type: "submit",
      value: "google-provider",
      label: { id: 1, text: "Sign in with Google", type: "info" },
      ...overrides,
    }),
    group: "oidc",
  } as UiNode;
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

  it("uses connect wording for settings provider actions", () => {
    const markup = renderToStaticMarkup(
      <OryNode kind="settings" node={providerNode({ name: "link" })} />,
    );

    expect(markup).toContain(">Connect with Google<");
    expect(markup).not.toContain("Continue with Google");
  });

  it("uses unlink wording for connected settings providers", () => {
    const markup = renderToStaticMarkup(
      <OryNode kind="settings" node={providerNode({ name: "unlink" })} />,
    );

    expect(markup).toContain(">Unlink Google<");
    expect(markup).not.toContain("Connect with Google");
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

describe("OryNode hidden input", () => {
  it("renders a hidden input field with name and value", () => {
    const node = inputNode({ type: "hidden", name: "csrf_token", value: "abc123" });
    const markup = renderToStaticMarkup(<OryNode node={node} />);

    expect(markup).toContain('type="hidden"');
    expect(markup).toContain('name="csrf_token"');
    expect(markup).toContain('value="abc123"');
  });

  it("defaults value to empty string when undefined", () => {
    const node = inputNode({ type: "hidden", name: "csrf_token", value: undefined });
    const markup = renderToStaticMarkup(<OryNode node={node} />);

    expect(markup).toContain('value=""');
  });
});

describe("OryNode checkbox input", () => {
  it("renders a checkbox with label inside a horizontal field", () => {
    const node = inputNode({
      type: "checkbox",
      name: "traits.terms",
      value: "true",
      label: { id: 1, text: "Accept terms", type: "info" },
    });
    const markup = renderToStaticMarkup(<OryNode node={node} />);

    expect(markup).toContain('data-slot="checkbox"');
    expect(markup).toContain("Accept terms");
  });

  it("marks the field as invalid when messages contain errors", () => {
    const node = inputNode({
      type: "checkbox",
      name: "traits.terms",
      label: { id: 1, text: "Accept terms", type: "info" },
    });
    node.messages = [{ id: 1, text: "Required", type: "error" }];
    const markup = renderToStaticMarkup(<OryNode node={node} />);

    expect(markup).toContain('data-invalid="true"');
  });
});

describe("OryNode code input", () => {
  it("renders an OTP code input", () => {
    const node = inputNode({
      type: "text",
      name: "code",
      maxlength: 6,
      label: { id: 1, text: "Verification code", type: "info" },
    });
    const markup = renderToStaticMarkup(<OryNode node={node} />);

    expect(markup).toContain('data-slot="input-otp"');
    expect(markup).toContain("Verification code");
  });
});

describe("OryNode default text input", () => {
  it("renders a text input with label inside a field", () => {
    const node = inputNode({
      type: "email",
      name: "traits.email",
      label: { id: 1, text: "Email address", type: "info" },
    });
    const markup = renderToStaticMarkup(<OryNode node={node} />);

    expect(markup).toContain('data-slot="field"');
    expect(markup).toContain("Email address");
    expect(markup).toContain('type="email"');
  });

  it("renders description text when provided", () => {
    const node = inputNode({
      type: "text",
      name: "traits.email",
      label: { id: 1, text: "Email", type: "info" },
      description: "We will never share your email",
    });
    const markup = renderToStaticMarkup(<OryNode node={node} />);

    expect(markup).toContain("We will never share your email");
  });

  it("marks field as invalid when messages contain errors", () => {
    const node = inputNode({
      type: "text",
      name: "traits.email",
      label: { id: 1, text: "Email", type: "info" },
    });
    node.messages = [{ id: 1, text: "Invalid email", type: "error" }];
    const markup = renderToStaticMarkup(<OryNode node={node} />);

    expect(markup).toContain('data-invalid="true"');
    expect(markup).toContain("Invalid email");
  });
});

describe("OryNode text", () => {
  it("renders text content in a paragraph", () => {
    const node = baseNode("text", "default", {
      text: { id: 1, text: "Important information", type: "info" },
    });
    const markup = renderToStaticMarkup(<OryNode node={node} />);

    expect(markup).toContain("Important information");
  });

  it("applies destructive class when messages contain errors", () => {
    const node = baseNode("text", "default", {
      text: { id: 1, text: "Error message", type: "error" },
    });
    node.messages = [{ id: 1, text: "", type: "error" }];
    const markup = renderToStaticMarkup(<OryNode node={node} />);

    expect(markup).toContain("text-destructive");
  });

  it("returns null when text is empty", () => {
    const node = baseNode("text", "default", { text: { id: 1, text: "", type: "info" } });
    expect(renderToStaticMarkup(<OryNode node={node} />)).toBe("");
  });
});

describe("OryNode anchor", () => {
  it("renders a link button with the title text", () => {
    const node = baseNode("a", "default", {
      title: { id: 1, text: "Sign up", type: "info" },
      href: "/self-service/registration/browser",
    });
    const markup = renderToStaticMarkup(<OryNode node={node} />);

    expect(markup).toContain("Sign up");
    expect(markup).toContain('href="/self-service/registration/browser"');
  });

  it("returns null for an unsafe href", () => {
    const node = baseNode("a", "default", {
      title: { id: 1, text: "Malicious", type: "info" },
      href: "http://evil.example.com",
    });
    expect(renderToStaticMarkup(<OryNode node={node} />)).toBe("");
  });

  it("falls back to localized continue text when title is missing", () => {
    const node = baseNode("a", "default", {
      href: "/self-service/registration/browser",
    });
    const markup = renderToStaticMarkup(<OryNode node={node} />);

    expect(markup).toContain(">Continue<");
  });
});

describe("OryNode image", () => {
  it("renders an img element for a non-QR image", () => {
    const node = baseNode("img", "default", {
      src: "https://example.com/logo.png",
      width: 200,
      height: 100,
    });
    const markup = renderToStaticMarkup(<OryNode node={node} />);

    expect(markup).toContain('<img');
    expect(markup).toContain('src="https://example.com/logo.png"');
  });

  it("wraps QR code image in a container div", () => {
    const node = baseNode("img", "totp", {
      src: "https://example.com/qr.png",
    });
    const markup = renderToStaticMarkup(<OryNode node={node} />);

    expect(markup).toContain("aspect-square");
    expect(markup).toContain("QR code");
  });

  it("renders a base64 QR code supplied by Ory", () => {
    const node = baseNode("img", "totp", {
      src: "data:image/png;base64,iVBORw0KGgo=",
    });
    const markup = renderToStaticMarkup(<OryNode node={node} />);

    expect(markup).toContain('src="data:image/png;base64,iVBORw0KGgo="');
  });

  it("returns null for an unsafe QR code data URL", () => {
    const node = baseNode("img", "totp", {
      src: "data:image/svg+xml,<svg></svg>",
    });
    expect(renderToStaticMarkup(<OryNode node={node} />)).toBe("");
  });

  it("returns null for an unsafe image src", () => {
    const node = baseNode("img", "default", {
      src: "http://evil.example.com/img.png",
    });
    expect(renderToStaticMarkup(<OryNode node={node} />)).toBe("");
  });
});

describe("OryNode div", () => {
  it("renders a div with custom class and data attributes", () => {
    const node = baseNode("div", "default", {
      _class: "custom-class",
      id: "my-div",
      data: { customAttr: "value1", other: "value2" },
    });
    const markup = renderToStaticMarkup(<OryNode node={node} />);

    expect(markup).toContain('class="custom-class"');
    expect(markup).toContain('id="my-div"');
    expect(markup).toContain('data-customAttr="value1"');
    expect(markup).toContain('data-other="value2"');
  });
});

describe("OryNode script", () => {
  it("renders a script tag for a safe script src", () => {
    const node = baseNode("script", "default", {
      src: "https://example.com/webauthn.js",
      async: true,
      type: "text/javascript",
    });
    const markup = renderToStaticMarkup(<OryNode node={node} />);

    expect(markup).toContain('src="https://example.com/webauthn.js"');
    expect(markup).toContain('data-strategy="afterInteractive"');
  });

  it("returns null for an unsafe script src", () => {
    const node = baseNode("script", "default", {
      src: "http://evil.example.com/script.js",
    });
    expect(renderToStaticMarkup(<OryNode node={node} />)).toBe("");
  });
});

describe("OryNode unknown type", () => {
  it("returns null for an unrecognized node type", () => {
    const node = baseNode("unknown", "default", {});
    expect(renderToStaticMarkup(<OryNode node={node} />)).toBe("");
  });
});
