import { describe, expect, it, vi } from "vitest";

describe("lib/branding", () => {
  it("exports default branding values when env vars are unset", async () => {
    vi.resetModules();
    delete process.env.NEXT_PUBLIC_BRAND_NAME;
    delete process.env.NEXT_PUBLIC_BRAND_MARK;
    delete process.env.NEXT_PUBLIC_BRAND_LOGO_LIGHT;
    delete process.env.NEXT_PUBLIC_BRAND_LOGO_DARK;

    const branding = await import("./branding");

    expect(branding.brandName).toBe("Your Platform");
    expect(branding.brandMark).toBe("YP");
    expect(branding.brandLogoLight).toBe("/next.svg");
    expect(branding.brandLogoDark).toBe("/next-dark.svg");
    expect(branding.brandFaviconLight).toBe("");
    expect(branding.brandFaviconDark).toBe("");
  });

  it("falls back to light logo when brandLogoDark is empty", async () => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_BRAND_LOGO_LIGHT = "/custom-light.svg";
    process.env.NEXT_PUBLIC_BRAND_LOGO_DARK = "";

    const branding = await import("./branding");

    expect(branding.brandLogoLight).toBe("/custom-light.svg");
    expect(branding.brandLogoDark).toBe("/custom-light.svg");
  });

  it("uses default dark logo when brandLogoDark is unset", async () => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_BRAND_LOGO_LIGHT = "/custom-light.svg";
    delete process.env.NEXT_PUBLIC_BRAND_LOGO_DARK;

    const branding = await import("./branding");

    expect(branding.brandLogoDark).toBe("/next-dark.svg");
  });

  it("uses an explicitly configured dark logo", async () => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_BRAND_LOGO_DARK = "/custom-dark.svg";

    const branding = await import("./branding");

    expect(branding.brandLogoDark).toBe("/custom-dark.svg");
  });

  it("reads brandFaviconLight and brandFaviconDark when set", async () => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_BRAND_FAVICON_LIGHT = "/favicon.ico";
    process.env.NEXT_PUBLIC_BRAND_FAVICON_DARK = "/favicon-dark.ico";

    const branding = await import("./branding");

    expect(branding.brandFaviconLight).toBe("/favicon.ico");
    expect(branding.brandFaviconDark).toBe("/favicon-dark.ico");
  });

  it("derives brandMark from brandName initials when NEXT_PUBLIC_BRAND_MARK is omitted", async () => {

    vi.resetModules();
    process.env.NEXT_PUBLIC_BRAND_NAME = "Acme Identity Systems";
    delete process.env.NEXT_PUBLIC_BRAND_MARK;

    const branding = await import("./branding");

    expect(branding.brandName).toBe("Acme Identity Systems");
    expect(branding.brandMark).toBe("AI");
  });

  it("uses NEXT_PUBLIC_BRAND_MARK when explicitly provided", async () => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_BRAND_NAME = "Acme Identity Systems";
    process.env.NEXT_PUBLIC_BRAND_MARK = "custom";

    const branding = await import("./branding");

    expect(branding.brandMark).toBe("CU");
  });

  it("uses the first two characters for a single-word brand name", async () => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_BRAND_NAME = "A";
    delete process.env.NEXT_PUBLIC_BRAND_MARK;

    const branding = await import("./branding");

    expect(branding.brandMark).toBe("A");
  });
});
