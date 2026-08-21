import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { UiNode } from "@ory/client-fetch";

import type { OryFlow } from "@/lib/ory/types";

import { FlowForm } from "./flow-form";

function inputNode(overrides: Record<string, unknown> = {}): UiNode {
  return {
    type: "input",
    group: "password",
    messages: [],
    meta: {},
    attributes: {
      node_type: "input",
      name: "identifier",
      type: "email",
      label: { id: 1, text: "Email address", type: "info" },
      ...overrides,
    },
  } as unknown as UiNode;
}

function providerNode(overrides: Record<string, unknown> = {}): UiNode {
  return {
    ...inputNode({
      name: "provider",
      type: "submit",
      value: "google-provider",
      label: { id: 1, text: "Sign in with Google", type: "info" },
      ...overrides,
    }),
    group: "oidc",
  } as UiNode;
}

function groupedNode(group: string, overrides: Record<string, unknown> = {}): UiNode {
  return {
    ...inputNode(overrides),
    group,
  } as UiNode;
}

function lookupCodesNode(): UiNode {
  return {
    type: "text",
    group: "lookup_secret",
    messages: [],
    meta: {
      label: {
        id: 10,
        text: "These are your back up recovery codes. Please keep them in a safe place!",
        type: "info",
      },
    },
    attributes: {
      node_type: "text",
      id: "lookup_secret_codes",
      text: {
        id: 11,
        text: "safe-code-1, used",
        type: "info",
        context: {
          secrets: [
            {
              id: 12,
              text: "safe-code-1",
              type: "info",
              context: { secret: "safe-code-1" },
            },
            {
              id: 13,
              text: "Secret was used at 2021-10-14T07:38:51Z",
              type: "info",
              context: { used_at: "2021-10-14T07:38:51Z" },
            },
          ],
        },
      },
    },
  } as unknown as UiNode;
}

function emptyLookupCodesNode(): UiNode {
  return {
    type: "text",
    group: "lookup_secret",
    messages: [],
    meta: {},
    attributes: {
      node_type: "text",
      id: "lookup_secret_codes",
      text: {
        id: 20,
        text: "Recovery codes are not available yet",
        type: "info",
      },
    },
  } as unknown as UiNode;
}

function buildFlow(nodes: UiNode[], uiOverrides: Record<string, unknown> = {}): OryFlow {
  return {
    id: "flow-id",
    ui: {
      action: "/self-service/login/browser?flow=flow-id",
      method: "POST",
      messages: [],
      nodes,
      ...uiOverrides,
    },
  } as unknown as OryFlow;
}

describe("FlowForm", () => {
  it("returns null when the flow action is not from an allowed origin", () => {
    const flow = buildFlow([inputNode()], { action: "http://evil.example.com/login" });
    const markup = renderToStaticMarkup(<FlowForm flow={flow} kind="login" />);

    expect(markup).toBe("");
  });

  it("lowercases the form method, defaulting to post for anything other than get", () => {
    const getFlow = buildFlow([inputNode()], { method: "GET" });
    const getMarkup = renderToStaticMarkup(<FlowForm flow={getFlow} kind="login" />);
    expect(getMarkup).toContain('method="get"');

    const postFlow = buildFlow([inputNode()], { method: "POST" });
    const postMarkup = renderToStaticMarkup(<FlowForm flow={postFlow} kind="login" />);
    expect(postMarkup).toContain('method="post"');
  });

  it("renders no divider or provider section when there are no provider nodes", () => {
    const flow = buildFlow([inputNode()]);
    const markup = renderToStaticMarkup(<FlowForm flow={flow} kind="login" />);

    expect(markup).not.toContain('role="separator"');
    expect(markup).not.toContain('aria-label="Sign in with a social account"');
  });

  it("renders a single-column provider section with the 'Or' divider for one provider", () => {
    const flow = buildFlow([inputNode(), providerNode()]);
    const markup = renderToStaticMarkup(<FlowForm flow={flow} kind="login" />);

    expect(markup).toContain('role="separator"');
    expect(markup).toContain('aria-label="Or"');
    expect(markup).toContain('aria-label="Sign in with a social account"');
    expect(markup).toContain("grid-cols-1");
  });

  it("renders a two-column responsive grid for exactly two providers", () => {
    const flow = buildFlow([
      inputNode(),
      providerNode({ value: "google-provider", label: { id: 1, text: "Sign in with Google", type: "info" } }),
      providerNode({ value: "github-provider", label: { id: 2, text: "Sign in with GitHub", type: "info" } }),
    ]);
    const markup = renderToStaticMarkup(<FlowForm flow={flow} kind="login" />);

    expect(markup).toContain("grid-cols-1 sm:grid-cols-2");
    expect(markup).toContain('aria-label="Or"');
  });

  it("keeps settings provider nodes inline without the social-login menu", () => {
    const flow = buildFlow([inputNode(), providerNode({ name: "link" })]);
    const markup = renderToStaticMarkup(
      <FlowForm flow={flow} kind="settings" separateProviders={false} settingsArea="connections" />,
    );

    expect(markup).toContain("Connect with Google");
    expect(markup).not.toContain('role="separator"');
    expect(markup).not.toContain('aria-label="Sign in with a social account"');
    expect(markup).toContain('data-slot="card-content"');
    expect(markup).not.toContain('data-slot="card-header"');
    expect(markup).not.toContain('data-slot="card-footer"');
  });

  it("renders WebAuthn and passkey nodes in dedicated security cards", () => {
    const flow = buildFlow([
      groupedNode("webauthn", { name: "webauthn_register", type: "submit" }),
      groupedNode("passkey", { name: "passkey_register", type: "submit" }),
    ]);
    const markup = renderToStaticMarkup(
      <FlowForm flow={flow} kind="settings" separateProviders={false} settingsArea="security" />,
    );

    expect(markup).toContain(">Security keys and biometrics<");
    expect(markup).toContain(">Passkeys<");
    expect(markup).not.toContain(">Additional settings<");
  });

  it("renders the selected settings area as cards with one form per Ory group", () => {
    const flow = buildFlow([
      groupedNode("default", { name: "csrf_token", type: "hidden" }),
      groupedNode("profile", {
        name: "traits.email",
        required: true,
        label: { id: 2, text: "Email address", type: "info" },
      }),
      groupedNode("password", {
        name: "password",
        type: "password",
        required: true,
        label: { id: 3, text: "Password", type: "info" },
      }),
      groupedNode("totp", {
        name: "action",
        type: "submit",
        value: "totp",
        label: { id: 4, text: "Save", type: "info" },
      }),
      groupedNode("lookup_secret", {
        name: "lookup_secret_regenerate",
        type: "submit",
        value: "true",
        label: { id: 5, text: "Generate new backup recovery codes", type: "info" },
      }),
      providerNode({ name: "link" }),
    ]);
    const markup = renderToStaticMarkup(
      <FlowForm flow={flow} kind="settings" separateProviders={false} settingsArea="security" />,
    );

    expect(markup).not.toContain(">Profile<");
    expect(markup).toContain(">Password<");
    expect(markup).toContain(">Authenticator app<");
    expect(markup).toContain(">Backup recovery codes<");
    expect(markup).not.toContain(">Connected accounts<");
    expect(markup).toContain("Generate new backup recovery codes");
    expect(markup).toContain('data-settings-form="lookup_secret"');
    expect(markup).toContain('data-settings-area-content="security"');
    expect(markup).toContain('data-slot="card-footer"');
    expect((markup.match(/<form /g) ?? []).length).toBe(3);
    expect((markup.match(/type="hidden"/g) ?? []).length).toBe(3);
    expect((markup.match(/data-settings-card=/g) ?? []).length).toBe(3);
  });

  it("renders structured recovery codes without exposing used code values", () => {
    const flow = buildFlow([
      groupedNode("default", { name: "csrf_token", type: "hidden" }),
      lookupCodesNode(),
      groupedNode("lookup_secret", {
        name: "lookup_secret_confirm",
        type: "submit",
        value: "true",
        label: { id: 14, text: "Confirm backup recovery codes", type: "info" },
      }),
    ]);
    const markup = renderToStaticMarkup(
      <FlowForm flow={flow} kind="settings" separateProviders={false} settingsArea="security" />,
    );

    expect(markup).toContain('data-recovery-codes="true"');
    expect(markup).toContain("1 active code");
    expect(markup).toContain("Confirm your new codes");
    expect(markup).toContain("Confirm backup recovery codes");
    expect(markup).not.toContain('data-slot="dialog-trigger"');
    expect(markup).not.toContain("Secret was used at");
    expect(markup).not.toContain('data-slot="card-footer"');
    expect((markup.match(/<form /g) ?? []).length).toBe(1);
    expect((markup.match(/type="hidden"/g) ?? []).length).toBe(1);
  });

  it("keeps visible nodes from unknown settings groups in one additional form", () => {
    const flow = buildFlow([
      groupedNode("default", { name: "csrf_token", type: "hidden" }),
      groupedNode("profile", { name: "traits.email", type: "email" }),
      groupedNode("custom", { name: "custom_value", type: "text" }),
    ]);
    const markup = renderToStaticMarkup(
      <FlowForm flow={flow} kind="settings" separateProviders={false} settingsArea="profile" />,
    );

    expect(markup).toContain(">Additional settings<");
    expect((markup.match(/name="custom_value"/g) ?? []).length).toBe(1);
    expect((markup.match(/type="hidden"/g) ?? []).length).toBe(2);
  });

  it("keeps unknown settings groups visible in every settings area", () => {
    const flow = buildFlow([
      groupedNode("default", { name: "csrf_token", type: "hidden" }),
      groupedNode("custom", { name: "custom_value", type: "text" }),
    ]);
    const markup = renderToStaticMarkup(
      <FlowForm flow={flow} kind="settings" separateProviders={false} settingsArea="security" />,
    );

    expect(markup).toContain(">Additional settings<");
    expect(markup).toContain('name="custom_value"');
  });

  it("keeps a recovery confirmation action visible without structured codes", () => {
    const flow = buildFlow([
      groupedNode("default", { name: "csrf_token", type: "hidden" }),
      emptyLookupCodesNode(),
      groupedNode("lookup_secret", {
        name: "lookup_secret_confirm",
        type: "submit",
        value: "true",
        label: { id: 21, text: "Confirm backup recovery codes", type: "info" },
      }),
    ]);
    const markup = renderToStaticMarkup(
      <FlowForm flow={flow} kind="settings" separateProviders={false} settingsArea="security" />,
    );

    expect(markup).toContain("Recovery codes are not available yet");
    expect(markup).toContain("Confirm backup recovery codes");
  });

  it("namespaced hidden inputs remain unique across independent settings forms", () => {
    const flow = buildFlow([
      groupedNode("default", { name: "csrf_token", type: "hidden" }),
      groupedNode("password", { name: "password", type: "password" }),
      groupedNode("totp", { name: "totp_code", type: "text" }),
    ]);
    const markup = renderToStaticMarkup(
      <FlowForm flow={flow} kind="settings" separateProviders={false} settingsArea="security" />,
    );
    const ids = [...markup.matchAll(/ id="([^"]+)"/g)].map((match) => match[1]);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps group-specific hidden inputs in their owning settings form", () => {
    const flow = buildFlow([
      groupedNode("default", { name: "csrf_token", type: "hidden" }),
      groupedNode("password", { name: "password", type: "password" }),
      groupedNode("totp", { name: "method", type: "hidden", value: "totp" }),
    ]);
    const markup = renderToStaticMarkup(
      <FlowForm flow={flow} kind="settings" separateProviders={false} settingsArea="security" />,
    );

    expect(markup).toContain('id="settings-totp-form-method"');
    expect(markup).not.toContain('id="settings-password-form-method"');
    expect((markup.match(/name="method"/g) ?? []).length).toBe(1);
    expect((markup.match(/name="csrf_token"/g) ?? []).length).toBe(2);
  });

  it("keeps hidden inputs from unknown groups in their additional form", () => {
    const flow = buildFlow([
      groupedNode("default", { name: "csrf_token", type: "hidden" }),
      groupedNode("custom", { name: "custom_token", type: "hidden", value: "custom" }),
    ]);
    const markup = renderToStaticMarkup(
      <FlowForm flow={flow} kind="settings" separateProviders={false} settingsArea="profile" />,
    );

    expect(markup).toContain('data-settings-form="other"');
    expect(markup).toContain('name="custom_token"');
    expect((markup.match(/name="custom_token"/g) ?? []).length).toBe(1);
  });

  it("renders the lookup-secret login field as an alphanumeric recovery-code input", () => {
    const lookupInput = groupedNode("lookup_secret", {
      name: "lookup_secret",
      type: "text",
      required: true,
      label: { id: 15, text: "Recovery code", type: "info" },
    });
    const flow = buildFlow([lookupInput]);
    const markup = renderToStaticMarkup(<FlowForm flow={flow} kind="login" />);

    expect(markup).toContain('name="lookup_secret"');
    expect(markup).toContain('autoComplete="one-time-code"');
    expect(markup).toContain("Recovery code");
    expect(markup).not.toContain('data-slot="input-otp"');
  });

  it("switches to a compact three-column layout with the 'Or continue with' divider for three or more providers", () => {
    const flow = buildFlow([
      inputNode(),
      providerNode({ value: "google-provider", label: { id: 1, text: "Sign in with Google", type: "info" } }),
      providerNode({ value: "github-provider", label: { id: 2, text: "Sign in with GitHub", type: "info" } }),
      providerNode({ value: "facebook-provider", label: { id: 3, text: "Sign in with Facebook", type: "info" } }),
    ]);
    const markup = renderToStaticMarkup(<FlowForm flow={flow} kind="login" />);

    expect(markup).toContain("grid-cols-3");
    expect(markup).toContain('aria-label="Or continue with"');
    expect((markup.match(/class="sr-only"/g) ?? []).length).toBe(3);
  });

  it("omits the divider when there are only provider nodes and no form fields", () => {
    const flow = buildFlow([providerNode()]);
    const markup = renderToStaticMarkup(<FlowForm flow={flow} kind="login" />);

    expect(markup).not.toContain('role="separator"');
    expect(markup).toContain('aria-label="Sign in with a social account"');
  });

  it("omits the divider when only providers and hidden inputs exist (social-only flow)", () => {
    const flow = buildFlow([
      groupedNode("default", { name: "csrf_token", type: "hidden" }),
      providerNode(),
      providerNode({ value: "github-provider", label: { id: 2, text: "Sign in with GitHub", type: "info" } }),
    ]);
    const markup = renderToStaticMarkup(<FlowForm flow={flow} kind="login" />);

    expect(markup).not.toContain('role="separator"');
    expect(markup).toContain('aria-label="Sign in with a social account"');
  });

  it("renders the divider for code (passwordless) method with providers", () => {
    const flow = buildFlow([
      groupedNode("default", { name: "csrf_token", type: "hidden" }),
      groupedNode("code", { name: "code", type: "text", label: { id: 1, text: "Verification code", type: "info" } }),
      providerNode(),
    ]);
    const markup = renderToStaticMarkup(<FlowForm flow={flow} kind="login" />);

    expect(markup).toContain('role="separator"');
    expect(markup).toContain('aria-label="Sign in with a social account"');
  });

  it("renders the divider for mixed password+social mode", () => {
    const flow = buildFlow([
      groupedNode("default", { name: "csrf_token", type: "hidden" }),
      groupedNode("password", { name: "password", type: "password", label: { id: 2, text: "Password", type: "info" } }),
      providerNode(),
    ]);
    const markup = renderToStaticMarkup(<FlowForm flow={flow} kind="login" />);

    expect(markup).toContain('role="separator"');
    expect(markup).toContain('aria-label="Sign in with a social account"');
  });

  it("renders the divider for password+social even when providers are compact", () => {
    const flow = buildFlow([
      groupedNode("password", { name: "password", type: "password" }),
      providerNode({ value: "google-provider", label: { id: 1, text: "Sign in with Google", type: "info" } }),
      providerNode({ value: "github-provider", label: { id: 2, text: "Sign in with GitHub", type: "info" } }),
      providerNode({ value: "facebook-provider", label: { id: 3, text: "Sign in with Facebook", type: "info" } }),
    ]);
    const markup = renderToStaticMarkup(<FlowForm flow={flow} kind="login" />);

    expect(markup).toContain('aria-label="Or continue with"');
  });

  it("renders centered provider section when social-only", () => {
    const flow = buildFlow([
      groupedNode("default", { name: "csrf_token", type: "hidden" }),
      providerNode(),
      providerNode({ value: "github-provider", label: { id: 2, text: "Sign in with GitHub", type: "info" } }),
    ]);
    const markup = renderToStaticMarkup(<FlowForm flow={flow} kind="login" />);

    expect(markup).not.toContain('role="separator"');
    expect(markup).toContain('aria-label="Sign in with a social account"');
    expect(markup).toContain("flex-col items-center");
  });

  it("renders social-only with a single provider without a grid layout", () => {
    const flow = buildFlow([
      groupedNode("default", { name: "csrf_token", type: "hidden" }),
      providerNode(),
    ]);
    const markup = renderToStaticMarkup(<FlowForm flow={flow} kind="login" />);

    expect(markup).not.toContain('role="separator"');
    expect(markup).toContain('aria-label="Sign in with a social account"');
    expect(markup).toContain("flex-col items-center");
  });

  it("still includes hidden nodes in the form for csrf submission when social-only", () => {
    const flow = buildFlow([
      groupedNode("default", { name: "csrf_token", type: "hidden" }),
      providerNode(),
    ]);
    const markup = renderToStaticMarkup(<FlowForm flow={flow} kind="login" />);

    expect(markup).toContain('name="csrf_token"');
    expect(markup).toContain('type="hidden"');
  });

  it("omits the visible form-node wrapper when there are no non-hidden, non-provider nodes", () => {
    const flow = buildFlow([
      groupedNode("default", { name: "csrf_token", type: "hidden" }),
      providerNode(),
    ]);
    const markup = renderToStaticMarkup(<FlowForm flow={flow} kind="login" />);

    expect(markup).not.toContain('gap-5');
  });

  it("wraps the form in a bordered container without a card when embedded", () => {
    const flow = buildFlow([inputNode()]);
    const markup = renderToStaticMarkup(<FlowForm embedded flow={flow} kind="login" />);

    expect(markup).toContain("border-t border-border/70 pt-8");
    expect(markup).not.toContain('data-slot="card"');
  });

  it("renders embedded settings flows without the authentication border", () => {
    const flow = buildFlow([
      groupedNode("password", {
        name: "password",
        type: "password",
        label: { id: 1, text: "Password", type: "info" },
        onloadTrigger: "oryWebAuthnRegistration",
      }),
    ]);
    const markup = renderToStaticMarkup(
      <FlowForm
        embedded
        flow={flow}
        kind="settings"
        separateProviders={false}
        settingsArea="security"
      />,
    );

    expect(markup).not.toContain("border-t border-border/70 pt-8");
    expect(markup).toContain('data-settings-area-content="security"');
  });

  it("wraps the form in a card by default", () => {
    const flow = buildFlow([inputNode()]);
    const markup = renderToStaticMarkup(<FlowForm flow={flow} kind="login" />);

    expect(markup).toContain('data-slot="card"');
    expect(markup).toContain('data-slot="card-content"');
  });

  it("enables the WebAuthn script path when a node has an ory onload trigger", () => {
    const node = inputNode({ onloadTrigger: "oryWebAuthnRegistration" });
    const flow = buildFlow([node]);
    const markup = renderToStaticMarkup(<FlowForm flow={flow} kind="login" />);

    expect(markup).toContain('data-slot="card-content"');
  });

  it("does not enable the WebAuthn runtime for an unsupported trigger", () => {
    const flow = buildFlow([inputNode({ onloadTrigger: "oryFutureTrigger" })]);
    const markup = renderToStaticMarkup(<FlowForm flow={flow} kind="login" />);

    expect(markup).not.toContain("ory-webauthn-");
  });
});
