import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetVerificationFlow,
  mockIsRestartRedirect,
  mockRedirect,
  state,
} = vi.hoisted(() => ({
  mockGetVerificationFlow: vi.fn(),
  mockIsRestartRedirect: vi.fn(() => false),
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
  getVerificationFlowWithRequestHeaders: mockGetVerificationFlow,
}));

vi.mock("@/lib/ory/redirect", () => ({
  isOryFlowRestartRedirect: mockIsRestartRedirect,
}));

vi.mock("@/ory.config", () => ({
  get isOryConfigured() {
    return state.isOryConfigured;
  },
  appBaseUrl: undefined,
  oryCanonicalUrl: "",
  orySdkUrl: "",
  orySetupMessage: "unavailable",
}));

vi.mock("@/lib/i18n/server", () => ({
  getTranslations: vi.fn(async () => ({
    t: (key: string) => key,
  })),
}));

import VerificationPage, { generateMetadata } from "./page";

function buildVerificationFlow() {
  return {
    id: "verification-flow",
    ui: { action: "/self-service/verification", method: "POST", messages: [], nodes: [] },
  };
}

describe("VerificationPage", () => {
  beforeEach(() => {
    state.isOryConfigured = true;
    mockGetVerificationFlow.mockReset();
    mockIsRestartRedirect.mockReset();
    mockIsRestartRedirect.mockReturnValue(false);
    mockRedirect.mockClear();
  });

  it("generates verification metadata", async () => {
    await expect(
      generateMetadata({ searchParams: Promise.resolve({ lang: "es" }) }),
    ).resolves.toEqual({ title: "auth.verification.eyebrow" });
  });

  it("renders setup state when Ory is unavailable", async () => {
    state.isOryConfigured = false;

    const markup = renderToStaticMarkup(
      await VerificationPage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain("Access is temporarily unavailable");
    expect(mockGetVerificationFlow).not.toHaveBeenCalled();
  });

  it("redirects disabled verification with and without a locale", async () => {
    mockGetVerificationFlow.mockResolvedValue({ error: { id: "self_service_flow_disabled" } });

    await expect(
      VerificationPage({ searchParams: Promise.resolve({ flow: "disabled", lang: "es" }) }),
    ).rejects.toThrow("redirect:/error?reason=verification_disabled&lang=es");

    mockGetVerificationFlow.mockResolvedValueOnce({ error: { id: "self_service_flow_disabled" } });
    await expect(
      VerificationPage({ searchParams: Promise.resolve({ flow: "disabled" }) }),
    ).rejects.toThrow("redirect:/error?reason=verification_disabled");
  });

  it("restarts expired verification flows at the clean route", async () => {
    mockGetVerificationFlow.mockRejectedValueOnce(new Error("expired"));
    mockIsRestartRedirect.mockReturnValueOnce(true);

    await expect(
      VerificationPage({ searchParams: Promise.resolve({ flow: "expired", lang: "es" }) }),
    ).rejects.toThrow("redirect:/verification?lang=es");
  });

  it("rethrows non-restart verification errors", async () => {
    mockGetVerificationFlow.mockRejectedValueOnce(new Error("provider unavailable"));

    await expect(
      VerificationPage({ searchParams: Promise.resolve({ flow: "stale" }) }),
    ).rejects.toThrow("provider unavailable");
  });

  it("renders an available verification flow", async () => {
    mockGetVerificationFlow.mockResolvedValueOnce(buildVerificationFlow());

    const markup = renderToStaticMarkup(
      await VerificationPage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain("auth.verification.title");
  });

  it("renders the unavailable state when the provider returns no flow", async () => {
    mockGetVerificationFlow.mockResolvedValueOnce(null);

    const markup = renderToStaticMarkup(
      await VerificationPage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain("This flow is no longer available");
  });
});
