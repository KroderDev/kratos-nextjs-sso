// @vitest-environment jsdom

import { renderToStaticMarkup } from "react-dom/server";
import { act } from "react";
import * as React from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
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

let mountedRoot: Root | undefined;
let mountedContainer: HTMLDivElement | undefined;

afterEach(() => {
  if (mountedRoot) {
    act(() => mountedRoot?.unmount());
  }
  mountedContainer?.remove();
  mountedRoot = undefined;
  mountedContainer = undefined;
});

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

  it("falls back to the generic action label when submit attributes are empty", () => {
    const markup = renderToStaticMarkup(
      <OryNode
        node={submitNode({ name: undefined, value: undefined, label: undefined })}
      />,
    );

    expect(markup).toContain(">Continue<");
  });

  it("associates detached settings actions with their owning form", () => {
    const markup = renderToStaticMarkup(
      <OryNode
        formId="settings-lookup_secret-form"
        kind="settings"
        node={submitNode({ name: "lookup_secret_confirm", label: { id: 1, text: "Confirm codes" } })}
      />,
    );

    expect(markup).toContain('form="settings-lookup_secret-form"');
  });

  it("renders a confirmation dialog for destructive TOTP settings actions", () => {
    const node = submitNode({
      name: "totp_unlink",
      label: { id: 1, text: "Disable this method", type: "info" },
    });
    node.group = "totp";
    const markup = renderToStaticMarkup(
      <OryNode
        formId="settings-totp-form"
        kind="settings"
        node={node}
      />,
    );

    expect(markup).toContain('data-ory-destructive-trigger="totp_unlink"');
    expect(markup).toContain('data-slot="alert-dialog-trigger"');
  });

  it("renders a confirmation dialog for disabling recovery codes", () => {
    const node = submitNode({
      name: "lookup_secret_disable",
      label: { id: 1, text: "Disable recovery codes", type: "info" },
    });
    node.group = "lookup_secret";
    const markup = renderToStaticMarkup(
      <OryNode
        formId="settings-lookup_secret-form"
        kind="settings"
        node={node}
      />,
    );

    expect(markup).toContain('data-ory-destructive-trigger="lookup_secret_disable"');
    expect(markup).toContain('data-slot="alert-dialog-trigger"');
  });

  it("supports compact rendering for destructive actions", () => {
    const node = submitNode({
      name: "lookup_secret_disable",
      label: { id: 1, text: "Disable recovery codes", type: "info" },
    });
    node.group = "lookup_secret";
    const markup = renderToStaticMarkup(
      <OryNode
        compactProvider
        formId="settings-lookup_secret-form"
        kind="settings"
        node={node}
      />,
    );

    expect(markup).toContain('data-ory-destructive-trigger="lookup_secret_disable"');
    expect(markup).not.toContain('aria-label="');
  });

  it("forwards the owning form to the recovery-code confirmation action", () => {
    const node = submitNode({
      name: "lookup_secret_disable",
      label: { id: 1, text: "Disable recovery codes", type: "info" },
    });
    node.group = "lookup_secret";
    mountedContainer = document.createElement("div");
    document.body.append(mountedContainer);
    mountedRoot = createRoot(mountedContainer);

    act(() => {
      mountedRoot?.render(
        <OryNode
          formId="settings-lookup_secret-form"
          kind="settings"
          node={node}
        />,
      );
    });

    const trigger = mountedContainer.querySelector<HTMLButtonElement>(
      '[data-ory-destructive-trigger="lookup_secret_disable"]',
    );
    expect(trigger).not.toBeNull();

    act(() => trigger?.click());

    expect(
      document.querySelector('button[type="submit"][form="settings-lookup_secret-form"]'),
    ).not.toBeNull();
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

  it("bypasses browser validation when selecting a login method", () => {
    const markup = renderToStaticMarkup(
      <OryNode kind="login" node={submitNode({ name: "method", value: "lookup_secret" })} />,
    );

    expect(markup).toContain("formNoValidate");
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

  it("uses the default checkbox label and value when attributes are absent", () => {
    const node = inputNode({
      type: "checkbox",
      name: undefined,
      value: undefined,
      label: undefined,
    });
    const markup = renderToStaticMarkup(<OryNode node={node} />);

    expect(markup).toContain("Confirm this choice");
    expect(markup).toContain('value="true"');
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

  it("renders code input errors", () => {
    const node = inputNode({
      type: "text",
      name: "code",
      maxlength: 6,
      label: { id: 1, text: "Verification code", type: "info" },
    });
    node.messages = [{ id: 2, text: "Invalid code", type: "error" }];
    const markup = renderToStaticMarkup(<OryNode node={node} />);

    expect(markup).toContain("Invalid code");
  });

  it("renders a Kratos TOTP code as an OTP input", () => {
    const node = inputNode({
      group: "totp",
      type: "text",
      name: "totp_code",
      maxlength: 6,
      label: { id: 1, text: "Authenticator code", type: "info" },
    });
    const markup = renderToStaticMarkup(<OryNode kind="login" node={node} />);

    expect(markup).toContain('name="totp_code"');
    expect(markup).toContain('data-slot="input-otp"');
    expect(markup).toContain('autoComplete="one-time-code"');
    expect(markup).toContain('value="password"');
    expect(markup).not.toContain("defaultValue");
    expect(markup).toContain("Authenticator code");
  });

  it("renders a lookup-secret login input as a text recovery-code field", () => {
    const node = inputNode({
      group: "lookup_secret",
      name: "lookup_secret",
      type: "text",
      required: true,
      label: { id: 1, text: "Recovery code", type: "info" },
    });
    node.group = "lookup_secret";
    const markup = renderToStaticMarkup(<OryNode kind="login" node={node} />);

    expect(markup).toContain('name="lookup_secret"');
    expect(markup).toContain('autoComplete="one-time-code"');
    expect(markup).toContain("Recovery code");
    expect(markup).not.toContain('data-slot="input-otp"');
  });

  it("renders lookup-secret input errors", () => {
    const node = inputNode({
      group: "lookup_secret",
      name: "lookup_secret",
      type: "text",
      label: { id: 1, text: "Recovery code", type: "info" },
    });
    node.group = "lookup_secret";
    node.messages = [{ id: 2, text: "Invalid recovery code", type: "error" }];
    const markup = renderToStaticMarkup(<OryNode kind="login" node={node} />);

    expect(markup).toContain("Invalid recovery code");
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

  it("uses fallback attributes and labels for an unconfigured text input", () => {
    const markup = renderToStaticMarkup(
      <OryNode node={inputNode({ name: undefined, type: undefined, label: undefined })} />,
    );

    expect(markup).toContain('id="ory-node"');
    expect(markup).toContain('name="ory-node"');
    expect(markup).toContain(">Value<");
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

  it("renders active recovery codes and redacts used entries", () => {
    const node = baseNode("text", "lookup_secret", {
      id: "lookup_secret_codes",
      text: {
        id: 1,
        text: "active-code, used",
        type: "info",
        context: {
          secrets: [
            {
              id: 2,
              text: "active-code",
              type: "info",
              context: { secret: "active-code" },
            },
            {
              id: 3,
              text: "Secret was used at 2021-10-14T07:38:51Z",
              type: "info",
              context: { used_at_unix: 1634197131 },
            },
          ],
        },
      },
    });
    const markup = renderToStaticMarkup(
      <OryNode kind="settings" lookupSecretPending node={node} />,
    );

    expect(markup).toContain('data-recovery-codes="true"');
    expect(markup).toContain("1 active code");
    expect(markup).toContain("Confirm your new codes");
    expect(markup).not.toContain('data-slot="dialog-trigger"');
    expect(markup).not.toContain("Secret was used at");
  });

  it("falls back to the Ory text when recovery-code context is unavailable", () => {
    const node = baseNode("text", "lookup_secret", {
      id: "lookup_secret_codes",
      text: { id: 1, text: "Recovery codes are available", type: "info" },
    });
    const markup = renderToStaticMarkup(<OryNode kind="settings" node={node} />);

    expect(markup).toContain("Recovery codes are available");
    expect(markup).toContain("text-sm leading-6 text-muted-foreground");
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

  it("preserves existing data prefixes and ignores non-object data", () => {
    const prefixedMarkup = renderToStaticMarkup(
      <OryNode
        node={baseNode("div", "default", {
          data: { "data-existing": "value" },
        })}
      />,
    );
    const invalidMarkup = renderToStaticMarkup(
      <OryNode node={baseNode("div", "default", { data: "invalid" })} />,
    );

    expect(prefixedMarkup).toContain('data-existing="value"');
    expect(invalidMarkup).not.toContain("data-invalid");
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

  it("keeps valid script security attributes and drops invalid values", () => {
    const validMarkup = renderToStaticMarkup(
      <OryNode
        node={baseNode("script", "default", {
          src: "https://example.com/webauthn.js",
          crossorigin: "anonymous",
          referrerpolicy: "strict-origin",
        })}
      />,
    );
    const invalidMarkup = renderToStaticMarkup(
      <OryNode
        node={baseNode("script", "default", {
          src: "https://example.com/webauthn.js",
          crossorigin: "invalid",
          referrerpolicy: "invalid",
        })}
      />,
    );

    expect(validMarkup).toContain('crossorigin="anonymous"');
    expect(validMarkup).toContain('referrerPolicy="strict-origin"');
    expect(invalidMarkup).not.toContain('crossorigin="invalid"');
    expect(invalidMarkup).not.toContain('referrerPolicy="invalid"');
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
