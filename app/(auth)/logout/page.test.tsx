import { describe, expect, it, vi } from "vitest";

const { mockGetSafeLogoutFlow, mockProviderLogoutParams, mockRedirect } = vi.hoisted(() => ({
  mockGetSafeLogoutFlow: vi.fn(),
  mockProviderLogoutParams: vi.fn(),
  mockRedirect: vi.fn((destination: string): never => {
    throw new Error(`redirect:${destination}`);
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("@/lib/ory/logout", () => ({
  getSafeLogoutFlow: mockGetSafeLogoutFlow,
}));

vi.mock("@/lib/ory/provider-handoff", () => ({
  providerLogoutParams: mockProviderLogoutParams,
}));

import LogoutPage from "./page";

describe("LogoutPage", () => {
  it("rejects invalid provider handoffs", async () => {
    mockProviderLogoutParams.mockReturnValue(null);

    await expect(
      LogoutPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("redirect:/error?reason=invalid_request");
  });

  it("starts Kratos logout with the validated provider callback", async () => {
    mockProviderLogoutParams.mockReturnValue({
      csrf: "csrf-token",
      providerReturnTo: "https://auth.example.com/logout",
      transaction: "transaction-id",
    });
    mockGetSafeLogoutFlow.mockResolvedValue({
      logout_url: "https://account.example.com/self-service/logout/browser?token=token",
      logout_token: "token",
    });

    await expect(
      LogoutPage({ searchParams: Promise.resolve({ flow: "logout" }) }),
    ).rejects.toThrow(
      "redirect:https://account.example.com/self-service/logout/browser?token=token",
    );
    expect(mockGetSafeLogoutFlow).toHaveBeenCalledWith("https://auth.example.com/logout");
  });

  it("shows an error when Kratos cannot create a logout flow", async () => {
    mockProviderLogoutParams.mockReturnValue({
      csrf: "csrf-token",
      providerReturnTo: "https://auth.example.com/logout",
      transaction: "transaction-id",
    });
    mockGetSafeLogoutFlow.mockResolvedValue({ logout_url: "#", logout_token: "" });

    await expect(
      LogoutPage({ searchParams: Promise.resolve({ flow: "logout" }) }),
    ).rejects.toThrow("redirect:/error?reason=logout_unavailable");
  });
});
