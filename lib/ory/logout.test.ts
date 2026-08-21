import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSafeLogoutFlow } from "./logout";

vi.mock("@ory/nextjs/app", () => ({
  getLogoutFlow: vi.fn(),
}));

import { getLogoutFlow } from "@ory/nextjs/app";

describe("getSafeLogoutFlow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns logout flow when returnTo succeeds", async () => {
    vi.mocked(getLogoutFlow).mockResolvedValueOnce({
      logout_url: "https://ory.example/logout?token=123",
      logout_token: "123",
    });

    const result = await getSafeLogoutFlow("https://app.example");
    expect(result.logout_url).toBe("https://ory.example/logout?token=123");
    expect(getLogoutFlow).toHaveBeenCalledWith({ returnTo: "https://app.example" });
  });

  it("falls back to getLogoutFlow without returnTo when returnTo throws 400 Bad Request", async () => {
    vi.mocked(getLogoutFlow)
      .mockRejectedValueOnce(new Error("Response returned an error code 400"))
      .mockResolvedValueOnce({
        logout_url: "https://ory.example/logout?token=456",
        logout_token: "456",
      });

    const result = await getSafeLogoutFlow("https://unallowed.example");
    expect(result.logout_url).toBe("https://ory.example/logout?token=456");
    expect(getLogoutFlow).toHaveBeenNthCalledWith(1, { returnTo: "https://unallowed.example" });
    expect(getLogoutFlow).toHaveBeenNthCalledWith(2);
  });

  it("returns fallback '#' when both calls throw an error", async () => {
    vi.mocked(getLogoutFlow).mockRejectedValue(new Error("Network Error"));

    const result = await getSafeLogoutFlow("https://app.example");
    expect(result.logout_url).toBe("#");
    expect(result.logout_token).toBe("");
  });

  it("does not redirect to an unrelated logout origin", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.example");
    vi.stubEnv("NEXT_PUBLIC_ORY_SDK_URL", "https://ory.example");
    vi.doMock("@/ory.config", () => ({
      appBaseUrl: "https://app.example",
      orySdkUrl: "https://ory.example",
    }));

    try {
      const { getSafeLogoutFlow: getConfiguredLogoutFlow } = await import("./logout");
      const { getLogoutFlow: getConfiguredProviderLogoutFlow } = await import("@ory/nextjs/app");
      vi.mocked(getConfiguredProviderLogoutFlow).mockResolvedValueOnce({
        logout_url: "https://attacker.example/logout",
        logout_token: "123",
      });

      const result = await getConfiguredLogoutFlow();

      expect(result.logout_url).toBe("#");
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("rewrites a provider logout URL to the application origin", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.example");
    vi.stubEnv("NEXT_PUBLIC_ORY_SDK_URL", "https://ory.example");

    try {
      const { getSafeLogoutFlow: getConfiguredLogoutFlow } = await import("./logout");
      const { getLogoutFlow: getConfiguredProviderLogoutFlow } = await import("@ory/nextjs/app");

      vi.mocked(getConfiguredProviderLogoutFlow).mockResolvedValue({
        logout_url: "https://ory.example/self-service/logout?token=123",
        logout_token: "123",
      });

      const result = await getConfiguredLogoutFlow("https://app.example");

      expect(result.logout_url).toBe(
        "https://app.example/self-service/logout?token=123",
      );
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("rejects malformed logout URLs from a configured provider", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.example");
    vi.stubEnv("NEXT_PUBLIC_ORY_SDK_URL", "https://ory.example");
    vi.doMock("@/ory.config", () => ({
      appBaseUrl: "https://app.example",
      orySdkUrl: "https://ory.example",
    }));

    try {
      const { getSafeLogoutFlow: getConfiguredLogoutFlow } = await import("./logout");
      const { getLogoutFlow: getConfiguredProviderLogoutFlow } = await import("@ory/nextjs/app");
      vi.mocked(getConfiguredProviderLogoutFlow).mockResolvedValueOnce({
        logout_url: "https://[invalid",
        logout_token: "123",
      });

      const result = await getConfiguredLogoutFlow();

      expect(result.logout_url).toBe("#");
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("accepts provider logout URLs when no application origin is configured", async () => {
    vi.resetModules();
    vi.doMock("@/ory.config", () => ({
      appBaseUrl: undefined,
      orySdkUrl: "https://ory.example",
    }));

    try {
      const { getSafeLogoutFlow: getConfiguredLogoutFlow } = await import("./logout");
      const { getLogoutFlow: getConfiguredProviderLogoutFlow } = await import("@ory/nextjs/app");
      vi.mocked(getConfiguredProviderLogoutFlow).mockResolvedValueOnce({
        logout_url: "https://ory.example/logout?token=123",
        logout_token: "123",
      });

      const result = await getConfiguredLogoutFlow();

      expect(result.logout_url).toBe("https://ory.example/logout?token=123");
    } finally {
      vi.doUnmock("@/ory.config");
    }
  });
});
