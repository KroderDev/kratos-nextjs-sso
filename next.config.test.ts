import { afterEach, describe, expect, it, vi } from "vitest";

import config from "./next.config";

afterEach(() => vi.unstubAllEnvs());

describe("provider callback CSP", () => {
  it.each([
    ["https://auth.example.com:443/provider", "https://auth.example.com"],
    ["https://user:pass@auth.example.com", undefined],
    ["ftp://auth.example.com", undefined],
    ["invalid", undefined],
  ])("validates the canonical form destination %s", async (canonical, expected) => {
    vi.stubEnv("NEXT_PUBLIC_ORY_SDK_URL", "http://127.0.0.1:4433");
    vi.stubEnv("NEXT_PUBLIC_ORY_CANONICAL_URL", canonical);
    vi.stubEnv("NEXT_PUBLIC_ORY_FORM_ACTION_ORIGINS", "");
    vi.stubEnv("NEXT_PUBLIC_ORY_OAUTH_ORIGINS", "");

    const headers = await config.headers!();
    const csp = headers[0].headers.find(({ key }) => key === "Content-Security-Policy")!.value;
    const sources = csp.match(/form-action ([^;]+)/)![1].split(" ");

    expect(sources).toContain("'self'");
    expect(sources).toContain("http://127.0.0.1:4433");
    if (expected) {
      expect(sources).toContain(expected);
    } else {
      expect(sources).toEqual(["'self'", "http://127.0.0.1:4433"]);
    }
  });

  it("keeps an explicitly empty public SDK URL ahead of the legacy setting", async () => {
    vi.stubEnv("NEXT_PUBLIC_ORY_SDK_URL", "");
    vi.stubEnv("ORY_SDK_URL", "https://legacy.example.com");
    vi.stubEnv("NEXT_PUBLIC_ORY_CANONICAL_URL", "");
    vi.stubEnv("NEXT_PUBLIC_ORY_FORM_ACTION_ORIGINS", "");
    vi.stubEnv("NEXT_PUBLIC_ORY_OAUTH_ORIGINS", "");

    const headers = await config.headers!();
    const csp = headers[0].headers.find(({ key }) => key === "Content-Security-Policy")!.value;
    expect(csp).toContain("form-action 'self';");
    expect(csp).not.toContain("https://legacy.example.com");
  });
});
