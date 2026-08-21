import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetRecoveryFlow, mockIsRestartRedirect, mockRedirect, state } = vi.hoisted(() => ({
  mockGetRecoveryFlow: vi.fn(),
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
  getRecoveryFlowWithRequestHeaders: mockGetRecoveryFlow,
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

import RecoveryPage, { generateMetadata } from "./page";

function buildRecoveryFlow() {
  return {
    id: "recovery-flow",
    ui: { action: "/self-service/recovery", method: "POST", messages: [], nodes: [] },
  };
}

describe("RecoveryPage", () => {
  beforeEach(() => {
    state.isOryConfigured = true;
    mockGetRecoveryFlow.mockReset();
    mockIsRestartRedirect.mockReset();
    mockIsRestartRedirect.mockReturnValue(false);
    mockRedirect.mockClear();
  });

  it("generates recovery metadata", async () => {
    await expect(
      generateMetadata({ searchParams: Promise.resolve({ lang: "es" }) }),
    ).resolves.toEqual({ title: "auth.login.footer.recoverAccess" });
  });

  it("renders setup state when Ory is unavailable", async () => {
    state.isOryConfigured = false;

    const markup = renderToStaticMarkup(
      await RecoveryPage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain("Access is temporarily unavailable");
    expect(mockGetRecoveryFlow).not.toHaveBeenCalled();
  });

  it("redirects disabled recovery with and without a locale", async () => {
    mockGetRecoveryFlow.mockResolvedValue({ error: { id: "self_service_flow_disabled" } });

    await expect(
      RecoveryPage({ searchParams: Promise.resolve({ flow: "disabled", lang: "es" }) }),
    ).rejects.toThrow("redirect:/error?reason=recovery_disabled&lang=es");

    mockGetRecoveryFlow.mockResolvedValueOnce({ error: { id: "self_service_flow_disabled" } });
    await expect(
      RecoveryPage({ searchParams: Promise.resolve({ flow: "disabled" }) }),
    ).rejects.toThrow("redirect:/error?reason=recovery_disabled");
  });

  it("restarts expired recovery flows at the clean route", async () => {
    mockGetRecoveryFlow.mockRejectedValueOnce(new Error("expired"));
    mockIsRestartRedirect.mockReturnValueOnce(true);

    await expect(
      RecoveryPage({ searchParams: Promise.resolve({ flow: "expired", lang: "es" }) }),
    ).rejects.toThrow("redirect:/recovery?lang=es");
  });

  it("rethrows non-restart recovery errors", async () => {
    mockGetRecoveryFlow.mockRejectedValueOnce(new Error("provider unavailable"));

    await expect(
      RecoveryPage({ searchParams: Promise.resolve({ flow: "stale" }) }),
    ).rejects.toThrow("provider unavailable");
  });

  it("renders an available recovery flow", async () => {
    mockGetRecoveryFlow.mockResolvedValueOnce(buildRecoveryFlow());

    const markup = renderToStaticMarkup(
      await RecoveryPage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain("auth.recovery.title");
  });

  it("renders the unavailable state when the provider returns no flow", async () => {
    mockGetRecoveryFlow.mockResolvedValueOnce(null);

    const markup = renderToStaticMarkup(
      await RecoveryPage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain("This flow is no longer available");
  });
});
