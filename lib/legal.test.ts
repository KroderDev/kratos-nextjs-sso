import { describe, expect, it, vi } from "vitest";

describe("lib/legal", () => {
  it("reads app-relative and HTTP(S) legal URLs", async () => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_TERMS_URL = "/legal/terms";
    process.env.NEXT_PUBLIC_PRIVACY_URL = "https://example.com/privacy";

    const legal = await import("./legal");

    expect(legal.termsOfServiceUrl).toBe("/legal/terms");
    expect(legal.privacyPolicyUrl).toBe("https://example.com/privacy");
  });

  it("omits unsafe or malformed legal URLs", async () => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_TERMS_URL = "javascript:alert(1)";
    process.env.NEXT_PUBLIC_PRIVACY_URL = "//example.com/privacy";

    const legal = await import("./legal");

    expect(legal.termsOfServiceUrl).toBe("");
    expect(legal.privacyPolicyUrl).toBe("");
  });

  it("omits absolute URLs that contain credentials", async () => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_TERMS_URL = "https://user:password@example.com/terms";
    process.env.NEXT_PUBLIC_PRIVACY_URL = "";

    const legal = await import("./legal");

    expect(legal.termsOfServiceUrl).toBe("");
    expect(legal.privacyPolicyUrl).toBe("");
  });
});
