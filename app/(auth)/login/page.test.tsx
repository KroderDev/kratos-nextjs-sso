import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LoginFlow, UiNode } from "@ory/client-fetch";

const { mockGetLoginFlow, mockIsRestartRedirect, mockRedirect, state } = vi.hoisted(() => ({
  mockGetLoginFlow: vi.fn(),
  mockIsRestartRedirect: vi.fn(() => false),
  mockRedirect: vi.fn((destination: string): never => {
    throw new Error(`redirect:${destination}`);
  }),
  state: {
    isOryConfigured: true,
    isRegistrationEnabled: true,
    rethrow: false,
  },
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
  unstable_rethrow: (error: unknown): never => {
    if (state.rethrow) {
      throw error;
    }
    return undefined as never;
  },
}));

vi.mock("@/ory.config", () => ({
  default: { project: { login_ui_url: "/login" } },
  appBaseUrl: undefined,
  get isOryConfigured() {
    return state.isOryConfigured;
  },
  get isRegistrationEnabled() {
    return state.isRegistrationEnabled;
  },
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
  isOryFlowRestartRedirect: mockIsRestartRedirect,
}));

vi.mock("@/lib/ory/login", () => ({
  getLoginFlowWithRequestHeaders: mockGetLoginFlow,
}));

import LoginPage, { generateMetadata, getLoginContext } from "./page";

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
  beforeEach(() => {
    state.isOryConfigured = true;
    state.isRegistrationEnabled = true;
    state.rethrow = false;
    mockGetLoginFlow.mockReset();
    mockIsRestartRedirect.mockReset();
    mockIsRestartRedirect.mockReturnValue(false);
    mockRedirect.mockClear();
  });

  it("uses contextual copy for refresh and AAL2 requests", () => {
    expect(getLoginContext({ refresh: "true" })).toEqual({
      descriptionKey: "auth.login.descriptionRefresh",
      titleKey: "auth.login.titleRefresh",
    });
    expect(getLoginContext({ aal: "aal2" })).toEqual({
      descriptionKey: "auth.login.descriptionAal2",
      titleKey: "auth.login.titleAal2",
    });
    expect(getLoginContext({})).toEqual({
      descriptionKey: "auth.login.description",
      titleKey: "auth.login.title",
    });
    expect(getLoginContext({}, true).descriptionKey).toBe("auth.login.descriptionSocialOnly");
  });

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

  it("generates contextual metadata for refresh and AAL2 requests", async () => {
    await expect(
      generateMetadata({ searchParams: Promise.resolve({ refresh: "true" }) }),
    ).resolves.toEqual({ title: "auth.login.titleRefresh" });
    await expect(
      generateMetadata({ searchParams: Promise.resolve({ aal: "aal2" }) }),
    ).resolves.toEqual({ title: "auth.login.titleAal2" });
  });

  it("redirects logout and invalid provider handoffs before loading a flow", async () => {
    await expect(
      LoginPage({
        searchParams: Promise.resolve({
          flow: "logout",
          transaction: "transaction-id",
          csrf: "csrf-token",
          return_to: "https://operator.example.com/logout",
        }),
      }),
    ).rejects.toThrow("redirect:/logout");

    await expect(
      LoginPage({
        searchParams: Promise.resolve({
          flow: "login",
          transaction: "transaction-id",
          csrf: "csrf-token",
          return_to: "https://attacker.example/login/callback",
        }),
      }),
    ).rejects.toThrow("redirect:/error?reason=invalid_request");

    expect(mockGetLoginFlow).not.toHaveBeenCalled();
  });

  it("continues with the original parameters if an invalid-handoff redirect returns", async () => {
    mockRedirect.mockImplementationOnce(() => undefined as never);
    mockGetLoginFlow.mockResolvedValueOnce(null);

    const markup = renderToStaticMarkup(
      await LoginPage({
        searchParams: Promise.resolve({
          flow: "login",
          transaction: "transaction-id",
          csrf: "csrf-token",
          return_to: "https://attacker.example/login/callback",
        }),
      }),
    );

    expect(mockGetLoginFlow).toHaveBeenCalledWith(
      expect.objectContaining({ flow: "login" }),
    );
    expect(markup).toContain("This flow is no longer available");
  });

  it("renders the unconfigured setup state without requesting a flow", async () => {
    state.isOryConfigured = false;

    const markup = renderToStaticMarkup(
      await LoginPage({ searchParams: Promise.resolve({ refresh: "true" }) }),
    );

    expect(markup).toContain("auth.login.titleRefresh");
    expect(markup).toContain("Access is temporarily unavailable");
    expect(mockGetLoginFlow).not.toHaveBeenCalled();
  });

  it("renders a password flow with return-to links and respects disabled registration", async () => {
    state.isRegistrationEnabled = false;
    mockGetLoginFlow.mockResolvedValueOnce(
      buildLoginFlow([
        buildFlowNode("default", { name: "csrf_token", type: "hidden" }),
        buildFlowNode("password", { name: "password", type: "password" }),
      ]),
    );

    const markup = renderToStaticMarkup(
      await LoginPage({
        searchParams: Promise.resolve({ return_to: "/dashboard", lang: "es" }),
      }),
    );

    expect(markup).toContain('name="password"');
    expect(markup).toContain("auth.login.footer.recoverAccess");
    expect(markup).not.toContain("auth.login.footer.createOne");
    expect(markup).toContain("return_to=%2Fdashboard");
  });

  it("renders social-only flows without password recovery", async () => {
    mockGetLoginFlow.mockResolvedValueOnce(
      buildLoginFlow([
        buildFlowNode("default", { name: "csrf_token", type: "hidden" }),
        buildFlowNode("oidc", {
          name: "provider",
          type: "submit",
          value: "google-provider",
        }),
      ]),
    );

    const markup = renderToStaticMarkup(
      await LoginPage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain("auth.login.descriptionSocialOnly");
    expect(markup).not.toContain("auth.login.footer.recoverAccess");
  });

  it("renders both registration and recovery links for a password flow", async () => {
    mockGetLoginFlow.mockResolvedValueOnce(
      buildLoginFlow([buildFlowNode("password", { name: "password", type: "password" })]),
    );

    const markup = renderToStaticMarkup(
      await LoginPage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain("auth.login.footer.createOne");
    expect(markup).toContain("auth.login.footer.recoverAccess");
    expect(markup).toContain('class="mx-2 text-border"');
  });

  it("renders the unavailable state when a flow request fails", async () => {
    mockGetLoginFlow.mockRejectedValueOnce(new Error("provider unavailable"));

    const markup = renderToStaticMarkup(
      await LoginPage({ searchParams: Promise.resolve({ flow: "stale-flow" }) }),
    );

    expect(markup).toContain("This flow is no longer available");
  });

  it("restarts an expired flow at the clean login route", async () => {
    mockGetLoginFlow.mockRejectedValueOnce(new Error("expired"));
    mockIsRestartRedirect.mockReturnValueOnce(true);

    await expect(
      LoginPage({
        searchParams: Promise.resolve({ flow: "expired-flow", return_to: "/dashboard", lang: "es" }),
      }),
    ).rejects.toThrow("redirect:/login?return_to=%2Fdashboard&lang=es");
  });

  it("rethrows non-restart flow errors", async () => {
    state.rethrow = true;
    mockGetLoginFlow.mockRejectedValueOnce(new Error("provider unavailable"));

    await expect(
      LoginPage({ searchParams: Promise.resolve({ flow: "stale-flow" }) }),
    ).rejects.toThrow("provider unavailable");
  });
});
