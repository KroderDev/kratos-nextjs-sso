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

  it("filters out the avatar_url field for registration and settings flows", () => {
    const nodes = [
      inputNode({
        name: "traits.avatar_url",
        type: "text",
        label: { id: 1, text: "Avatar URL", type: "info" },
      }),
      inputNode({
        name: "identifier",
        type: "email",
        label: { id: 2, text: "Email address", type: "info" },
      }),
    ];
    const flow = buildFlow(nodes);

    const registrationMarkup = renderToStaticMarkup(<FlowForm flow={flow} kind="registration" />);
    expect(registrationMarkup).not.toContain("Avatar URL");
    expect(registrationMarkup).toContain("Email address");

    const loginMarkup = renderToStaticMarkup(<FlowForm flow={flow} kind="login" />);
    expect(loginMarkup).toContain("Avatar URL");

    const settingsMarkup = renderToStaticMarkup(
      <FlowForm flow={flow} kind="settings" separateProviders={false} />,
    );
    expect(settingsMarkup).not.toContain("Avatar URL");
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
      <FlowForm flow={flow} kind="settings" separateProviders={false} />,
    );

    expect(markup).toContain("Connect with Google");
    expect(markup).not.toContain('role="separator"');
    expect(markup).not.toContain('aria-label="Sign in with a social account"');
  });

  it("groups settings nodes into translated sections with one form per action", () => {
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
        name: "action",
        type: "submit",
        value: "lookup_secret_regenerate",
        label: { id: 5, text: "Generate new backup recovery codes", type: "info" },
      }),
      providerNode({ name: "link" }),
    ]);
    const markup = renderToStaticMarkup(
      <FlowForm flow={flow} kind="settings" separateProviders={false} />,
    );

    expect(markup).toContain(">Profile<");
    expect(markup).toContain(">Password<");
    expect(markup).toContain(">Two-factor authentication<");
    expect(markup).toContain(">Backup recovery codes<");
    expect(markup).toContain(">Connected accounts<");
    expect(markup).toContain("Generate new backup recovery codes");
    expect((markup.match(/<form /g) ?? []).length).toBe(5);
    expect((markup.match(/type="hidden"/g) ?? []).length).toBe(5);
    expect((markup.match(/data-slot="field-set"/g) ?? []).length).toBe(5);
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

  it("wraps the form in a bordered container without a card when embedded", () => {
    const flow = buildFlow([inputNode()]);
    const markup = renderToStaticMarkup(<FlowForm embedded flow={flow} kind="login" />);

    expect(markup).toContain("border-t border-border/70 pt-8");
    expect(markup).not.toContain('data-slot="card"');
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
});
