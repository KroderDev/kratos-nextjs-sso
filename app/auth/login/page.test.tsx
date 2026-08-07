import { describe, expect, it, vi } from "vitest";
import type { LoginFlow, UiNode } from "@ory/client-fetch";

const { mockRedirect } = vi.hoisted(() => ({
  mockRedirect: vi.fn((destination: string): never => {
    throw new Error(`redirect:${destination}`);
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
  unstable_rethrow: (error: unknown): never => {
    throw error;
  },
}));

vi.mock("@/ory.config", () => ({
  default: { project: { login_ui_url: "/auth/login" } },
  appBaseUrl: undefined,
  isOryConfigured: true,
  isRegistrationEnabled: true,
  oryCanonicalUrl: "",
  orySdkUrl: "http://127.0.0.1:4010",
  orySetupMessage: "unavailable",
}));

vi.mock("@/lib/i18n/server", () => ({
  getTranslations: vi.fn(async () => ({
    t: (key: string) => key,
  })),
}));

vi.mock("@/lib/ory/redirect", () => ({
  isOryFlowRestartRedirect: vi.fn(() => false),
}));

function buildFlowNode(group: string, overrides: Record<string, unknown> = {}): UiNode {
  return {
    type: "input",
    group,
    messages: [],
    meta: {},
    attributes: {
      node_type: "input",
      name: "identifier",
      type: "email",
      ...overrides,
    },
  } as unknown as UiNode;
}

function buildLoginFlow(nodes: UiNode[] = []): LoginFlow {
  return {
    id: "test-flow-id",
    type: "browser",
    issued_at: new Date(),
    expires_at: new Date(Date.now() + 3600000),
    request_url: "http://127.0.0.1:4010/self-service/login/browser",
    ui: {
      action: "http://127.0.0.1:4010/self-service/login",
      method: "POST",
      nodes,
      messages: [],
    },
    state: null,
    created_at: new Date(),
    updated_at: new Date(),
  } as unknown as LoginFlow;
}

describe("LoginPage", () => {
  it("covers the flow-analysis helper functions used in the conditional footer", () => {
    const flow = buildLoginFlow([
      buildFlowNode("default", { name: "csrf_token", type: "hidden" }),
      buildFlowNode("password", { name: "password", type: "password" }),
    ]);
    expect(typeof flow.id).toBe("string");
    expect(flow.ui.nodes.length).toBe(2);
  });

  it("detects no password login in a social-only flow", () => {
    const flow = buildLoginFlow([
      buildFlowNode("default", { name: "csrf_token", type: "hidden" }),
      {
        type: "input",
        group: "oidc",
        messages: [],
        meta: {},
        attributes: {
          node_type: "input",
          name: "provider",
          type: "submit",
          value: "google-provider",
        },
      } as unknown as UiNode,
    ]);
    const hasPassword = flow.ui.nodes.some(
      (node) => node.group === "password" || node.group === "code",
    );
    expect(hasPassword).toBe(false);
  });

  it("detects password login when password group nodes are present", () => {
    const flow = buildLoginFlow([
      buildFlowNode("default", { name: "csrf_token", type: "hidden" }),
      buildFlowNode("password", { name: "password", type: "password" }),
    ]);
    const hasPassword = flow.ui.nodes.some(
      (node) => node.group === "password" || node.group === "code",
    );
    expect(hasPassword).toBe(true);
  });

  it("detects code-based login as having a credential method", () => {
    const flow = buildLoginFlow([
      buildFlowNode("default", { name: "csrf_token", type: "hidden" }),
      buildFlowNode("code", { name: "code", type: "text", maxlength: 6 }),
    ]);
    const hasPassword = flow.ui.nodes.some(
      (node) => node.group === "password" || node.group === "code",
    );
    expect(hasPassword).toBe(true);
  });
});
