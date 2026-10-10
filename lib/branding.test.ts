import { describe, expect, it, vi } from "vitest";

describe("lib/branding", () => {
  it("exports neutral default branding values when env vars are unset", async () => {
    vi.resetModules();
    delete process.env.NEXT_PUBLIC_BRAND_NAME;
    delete process.env.NEXT_PUBLIC_BRAND_LOGO_LIGHT;
    delete process.env.NEXT_PUBLIC_BRAND_LOGO_DARK;
    const branding = await import("./branding");

    expect(branding.brandName).toBe("Kratos SSO");
    expect(branding.brandLogoLight).toBe("");
    expect(branding.brandLogoDark).toBe("");
    expect(branding.brandFaviconLight).toBe("");
    expect(branding.brandFaviconDark).toBe("");
  });

  it("falls back to the light logo in both themes when only the light logo is set", async () => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_BRAND_LOGO_LIGHT = "/custom-light.svg";
    process.env.NEXT_PUBLIC_BRAND_LOGO_DARK = "";

    const branding = await import("./branding");

    expect(branding.brandLogoLight).toBe("/custom-light.svg");
    expect(branding.brandLogoDark).toBe("/custom-light.svg");
  });

  it("falls back to the light logo in both themes when the dark logo is unset", async () => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_BRAND_LOGO_LIGHT = "/custom-light.svg";
    delete process.env.NEXT_PUBLIC_BRAND_LOGO_DARK;

    const branding = await import("./branding");

    expect(branding.brandLogoLight).toBe("/custom-light.svg");
    expect(branding.brandLogoDark).toBe("/custom-light.svg");
  });

  it("uses an explicitly configured dark logo", async () => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_BRAND_LOGO_LIGHT = "/custom-light.svg";
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

});
