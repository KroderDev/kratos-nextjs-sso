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
});
