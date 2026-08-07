import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthenticatorAssuranceLevel } from "@ory/client-fetch";

const { mockGetServerSession, mockRedirect } = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
  mockRedirect: vi.fn((destination: string): never => {
    throw new Error(`redirect:${destination}`);
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("@ory/nextjs/app", () => ({
  getServerSession: mockGetServerSession,
}));

vi.mock("@/lib/i18n/server", () => ({
  getTranslations: vi.fn(async () => ({
    t: (key: string) => key,
  })),
}));

import LoginContinuePage, { generateMetadata } from "./page";

describe("LoginContinuePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockReset();
    mockRedirect.mockClear();
    mockRedirect.mockImplementation((destination: string): never => {
      throw new Error(`redirect:${destination}`);
    });
  });

  describe("generateMetadata", () => {
    it("returns the localized login title", async () => {
      const result = await generateMetadata({
        searchParams: Promise.resolve({ lang: "es" }),
      });

      expect(result).toEqual({ title: "auth.login.title" });
    });
  });

  it("redirects to error page when required params are missing", async () => {
    await expect(
      LoginContinuePage({
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("redirect:/auth/error?reason=invalid_request");

    expect(mockRedirect).toHaveBeenCalledWith("/auth/error?reason=invalid_request");
  });

  it("redirects to error page when transaction param is missing", async () => {
    await expect(
      LoginContinuePage({
        searchParams: Promise.resolve({
          csrf: "csrf-1",
          provider_callback: "https://example.com/callback",
        }),
      }),
    ).rejects.toThrow("redirect:/auth/error?reason=invalid_request");
  });

  it("redirects to error page when provider_callback param is missing", async () => {
    await expect(
      LoginContinuePage({
        searchParams: Promise.resolve({
          transaction: "txn-1",
          csrf: "csrf-1",
        }),
      }),
    ).rejects.toThrow("redirect:/auth/error?reason=invalid_request");
  });

  it("redirects unauthenticated users to login with return_to", async () => {
    mockGetServerSession.mockResolvedValue(null);

    await expect(
      LoginContinuePage({
        searchParams: Promise.resolve({
          transaction: "txn-1",
          csrf: "csrf-1",
          provider_callback: "https://auth.example.com/login/callback",
          lang: "es",
        }),
      }),
    ).rejects.toThrow("redirect:/auth/login");

    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining("/auth/login?return_to="),
    );
    const call = mockRedirect.mock.calls[0][0] as string;
    expect(call).toContain("/auth/login");
    const returnToStart = call.indexOf("return_to=") + "return_to=".length;
    const returnToEncoded = call.substring(returnToStart);
    const decoded = decodeURIComponent(returnToEncoded);
    expect(decoded).toContain("/auth/login/continue");
    expect(decoded).toContain("transaction=txn-1");
    expect(decoded).toContain("csrf=csrf-1");
    expect(decoded).toContain("lang=es");
  });

  it("redirects AAL1 sessions to a step-up login flow", async () => {
    mockGetServerSession.mockResolvedValue({
      authenticator_assurance_level: AuthenticatorAssuranceLevel.Aal1,
    });

    await expect(
      LoginContinuePage({
        searchParams: Promise.resolve({
          transaction: "txn-1",
          csrf: "csrf-1",
          provider_callback: "https://auth.example.com/login/callback",
        }),
      }),
    ).rejects.toThrow("redirect:/self-service/login/browser");

    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining("/self-service/login/browser"),
    );
    const call = mockRedirect.mock.calls[0][0] as string;
    expect(call).toContain("aal=aal2");
    expect(call).toContain("refresh=true");
    expect(call).toContain("return_to=");
    expect(call).toContain(encodeURIComponent("/auth/login/continue?"));
  });

  it("redirects AAL2 sessions to the provider callback", async () => {
    mockGetServerSession.mockResolvedValue({
      authenticator_assurance_level: AuthenticatorAssuranceLevel.Aal2,
    });

    await expect(
      LoginContinuePage({
        searchParams: Promise.resolve({
          transaction: "txn-1",
          csrf: "csrf-1",
          provider_callback: "https://auth.example.com/login/callback",
        }),
      }),
    ).rejects.toThrow("redirect:https://auth.example.com/login/callback");

    expect(mockRedirect).toHaveBeenCalledWith(
      "https://auth.example.com/login/callback?transaction=txn-1&csrf=csrf-1",
    );
  });

  it("redirects AAL3 sessions to the provider callback", async () => {
    mockGetServerSession.mockResolvedValue({
      authenticator_assurance_level: AuthenticatorAssuranceLevel.Aal3,
    });

    await expect(
      LoginContinuePage({
        searchParams: Promise.resolve({
          transaction: "txn-1",
          csrf: "csrf-1",
          provider_callback: "https://auth.example.com/login/callback",
        }),
      }),
    ).rejects.toThrow("redirect:https://auth.example.com/login/callback");

    expect(mockRedirect).toHaveBeenCalledWith(
      "https://auth.example.com/login/callback?transaction=txn-1&csrf=csrf-1",
    );
  });

  it("filters out non-string params when building the login redirect", async () => {
    mockGetServerSession.mockResolvedValue(null);

    await expect(
      LoginContinuePage({
        searchParams: Promise.resolve({
          transaction: "txn-1",
          csrf: "csrf-1",
          provider_callback: "https://auth.example.com/login/callback",
          extra: ["value1", "value2"],
        }),
      }),
    ).rejects.toThrow("redirect:/auth/login");

    const call = mockRedirect.mock.calls[0][0] as string;
    expect(call).not.toContain("extra");
  });

  it("filters out non-string params in the AAL1 step-up path", async () => {
    mockGetServerSession.mockResolvedValue({
      authenticator_assurance_level: AuthenticatorAssuranceLevel.Aal1,
    });

    await expect(
      LoginContinuePage({
        searchParams: Promise.resolve({
          transaction: "txn-1",
          csrf: "csrf-1",
          provider_callback: "https://auth.example.com/login/callback",
          extra: ["value1", "value2"],
        }),
      }),
    ).rejects.toThrow("redirect:/self-service/login/browser");

    const call = mockRedirect.mock.calls[0][0] as string;
    expect(call).not.toContain("extra");
  });
});
