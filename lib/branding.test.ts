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
});
