import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UiNode } from "@ory/client-fetch";

const { mockGetRegistrationFlow, mockRedirect, state } = vi.hoisted(() => ({
  mockGetRegistrationFlow: vi.fn(),
  mockRedirect: vi.fn((destination: string): never => {
    throw new Error(`redirect:${destination}`);
  }),
  state: { isOryConfigured: true },
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
  unstable_rethrow: (error: unknown): never => {
    throw error;
  },
}));

vi.mock("@/lib/ory/flow-request", () => ({
  getRegistrationFlowWithRequestHeaders: mockGetRegistrationFlow,
}));

vi.mock("@/ory.config", () => ({
  default: { project: { registration_ui_url: "/registration" } },
  appBaseUrl: undefined,
  get isOryConfigured() {
    return state.isOryConfigured;
  },
  oryCanonicalUrl: "",
  orySdkUrl: "",
  orySetupMessage: "",
}));

vi.mock("@/lib/i18n/server", () => ({
  getTranslations: vi.fn(async () => ({
    t: (key: string) => key,
  })),
}));

import RegistrationPage from "./page";
import { generateMetadata } from "./page";

function buildRegistrationFlow() {
  return {
    id: "registration-flow",
    ui: {
      action: "/self-service/registration",
      method: "POST",
      messages: [],
      nodes: [
        {
          type: "input",
          group: "password",
          messages: [],
          meta: {},
          attributes: {
            node_type: "input",
            name: "traits.email",
            type: "email",
            label: { id: 1, text: "Email", type: "info" },
          },
        } as unknown as UiNode,
      ],
    },
  };
}

describe("RegistrationPage", () => {
  beforeEach(() => {
    state.isOryConfigured = true;
    mockGetRegistrationFlow.mockReset();
    mockRedirect.mockClear();
  });

  it("generates registration metadata", async () => {
    await expect(
      generateMetadata({ searchParams: Promise.resolve({ lang: "es" }) }),
    ).resolves.toEqual({ title: "home.hero.createIdentity" });
  });

  it("redirects disabled registration responses to the specific error state", async () => {
    mockGetRegistrationFlow.mockResolvedValueOnce({
      error: { id: "self_service_flow_disabled" },
    });

    await expect(
      RegistrationPage({
        searchParams: Promise.resolve({ flow: "disabled-flow", lang: "es" }),
      }),
    ).rejects.toThrow("redirect:/error?reason=registration_disabled&lang=es");

    expect(mockRedirect).toHaveBeenCalledWith(
      "/error?reason=registration_disabled&lang=es",
    );

    mockGetRegistrationFlow.mockResolvedValueOnce({
      error: { id: "self_service_flow_disabled" },
    });
    await expect(
      RegistrationPage({ searchParams: Promise.resolve({ flow: "disabled-flow" }) }),
    ).rejects.toThrow("redirect:/error?reason=registration_disabled");
  });

  it("restarts expired registration flows at the clean registration route", async () => {
    mockGetRegistrationFlow.mockRejectedValueOnce({
      digest: "NEXT_REDIRECT;replace;https://auth.test/self-service/registration/browser;307;",
    });

    await expect(
      RegistrationPage({
        searchParams: Promise.resolve({ flow: "expired-flow" }),
      }),
    ).rejects.toThrow("redirect:/registration");

    expect(mockRedirect).toHaveBeenCalledWith("/registration");
  });

  it("rethrows non-restart registration errors", async () => {
    mockGetRegistrationFlow.mockRejectedValueOnce(new Error("provider unavailable"));

    await expect(
      RegistrationPage({ searchParams: Promise.resolve({ flow: "stale-flow" }) }),
    ).rejects.toThrow("provider unavailable");
  });

  it("renders the configured registration flow", async () => {
    mockGetRegistrationFlow.mockResolvedValueOnce(buildRegistrationFlow());

    const markup = renderToStaticMarkup(
      await RegistrationPage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain('name="traits.email"');
  });

  it("renders the unavailable state when the provider returns no flow", async () => {
    mockGetRegistrationFlow.mockResolvedValueOnce(null);

    const markup = renderToStaticMarkup(
      await RegistrationPage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain("This flow is no longer available");
  });

  it("renders the setup state when Ory is not configured", async () => {
    state.isOryConfigured = false;

    const markup = renderToStaticMarkup(
      await RegistrationPage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain("Access is temporarily unavailable");
    expect(mockGetRegistrationFlow).not.toHaveBeenCalled();
  });
});
