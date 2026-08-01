import { describe, expect, it, vi } from "vitest";

const { mockGetRegistrationFlow, mockRedirect } = vi.hoisted(() => ({
  mockGetRegistrationFlow: vi.fn(),
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

vi.mock("@ory/nextjs/app", () => ({
  getRegistrationFlow: mockGetRegistrationFlow,
}));

vi.mock("@/ory.config", () => ({
  default: { project: { registration_ui_url: "/auth/registration" } },
  appBaseUrl: undefined,
  isOryConfigured: true,
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

describe("RegistrationPage", () => {
  it("redirects disabled registration responses to the specific error state", async () => {
    mockGetRegistrationFlow.mockResolvedValueOnce({
      error: { id: "self_service_flow_disabled" },
    });

    await expect(
      RegistrationPage({
        searchParams: Promise.resolve({ flow: "disabled-flow", lang: "es" }),
      }),
    ).rejects.toThrow("redirect:/auth/error?reason=registration_disabled&lang=es");

    expect(mockRedirect).toHaveBeenCalledWith(
      "/auth/error?reason=registration_disabled&lang=es",
    );
  });

  it("restarts expired registration flows at the clean registration route", async () => {
    mockGetRegistrationFlow.mockRejectedValueOnce({
      digest: "NEXT_REDIRECT;replace;https://auth.test/self-service/registration/browser;307;",
    });

    await expect(
      RegistrationPage({
        searchParams: Promise.resolve({ flow: "expired-flow" }),
      }),
    ).rejects.toThrow("redirect:/auth/registration");

    expect(mockRedirect).toHaveBeenCalledWith("/auth/registration");
  });
});
